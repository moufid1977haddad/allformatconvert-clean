const { NextResponse } = require('next/server');
const { checkIpRateLimit } = require('./ipRateLimit');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('./globalSpend');
const { logUsageEvent } = require('./logEvent');
const { secondsUntilNextUtcMonth, nextUtcMonthIso } = require('./period');
const { sendAlert } = require('../alert');

// Wraps the 4 shared OpenAI/remove.bg routes. Order: Couche C (IP) first,
// then Couche A (global spend) -- a blocked IP attempt never reaches the
// spend reservation, but a request that clears the IP check still counts
// against the IP bucket even if it's then blocked by the spend cap (so a
// flood during a maxed-out month is still rate-limited, which is exactly
// when Couche C matters most).
/** @returns {Promise<{ok:false,response:import('next/server').NextResponse}|{ok:true,commit:(actualCostCents?:number|null,sendAlertFn?:(service:string,status:string)=>Promise<void>)=>Promise<void>,release:()=>Promise<void>}>} */
async function guardPaidRoute(req, { route, tool }) {
  const ipCheck = await checkIpRateLimit(req);
  if (!ipCheck.allowed) {
    const outcome = ipCheck.layer === 'ip_hour' ? 'denied_ip_hour' : 'denied_ip_day';
    await logUsageEvent({ route, tool, outcome });
    const minutes = Math.ceil(ipCheck.retryAfterSeconds / 60);
    const response = NextResponse.json(
      { error: `Too many requests from this network. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(ipCheck.retryAfterSeconds) } }
    );
    return { ok: false, response };
  }

  const reservation = await reserveGlobalSpend(route);
  if (!reservation.allowed) {
    await logUsageEvent({ route, tool, outcome: 'denied_global_spend' });
    const response = NextResponse.json(
      {
        error: `This tool has reached its usage limit for the month — that's a site-wide limit, not something on your end. It resets on ${nextUtcMonthIso()}.`,
      },
      { status: 503, headers: { 'Retry-After': String(secondsUntilNextUtcMonth()) } }
    );
    return { ok: false, response };
  }

  // Guards against a caller invoking commit()/release() more than once, in
  // any combination -- either would otherwise double-adjust the spend
  // counter and double-log the event. Does not defend against neither ever
  // being called; the route integrations that consume this must call
  // exactly one, always (try/finally), since that gap can't be closed from
  // inside the guard.
  let settled = false;
  return {
    ok: true,
    // actualCostCents has three meaningful states, and they must NOT be
    // collapsed into one "not a number" branch (that collapse is the exact
    // bug this fix corrects):
    //   - a number: the real cost is known -- reconcile normally.
    //   - null: the route's cost function explicitly reports "the provider
    //     didn't give us enough to compute a real cost" (e.g. a missing
    //     `usage` object). This must NEVER reconcile down to zero -- the
    //     worst-case reservation stays exactly as reserved, and the
    //     incident is alerted so it's never silently invisible.
    //   - undefined (argument omitted entirely): the route has no
    //     reconciliation step by design (remove-bg's flat, deterministic
    //     cost -- the reservation already equals the actual cost). Expected,
    //     not an incident, no alert.
    async commit(actualCostCents, sendAlertFn = sendAlert) {
      if (settled) return;
      settled = true;
      if (typeof actualCostCents === 'number') {
        await reconcileGlobalSpend(reservation.periodKey, reservation.reservedCents, actualCostCents);
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: actualCostCents });
      } else if (actualCostCents === null) {
        await sendAlertFn('quota-cost-unknown', tool ? `${route}:${tool}` : route);
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: reservation.reservedCents });
      } else {
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: reservation.reservedCents });
      }
    },
    async release() {
      if (settled) return;
      settled = true;
      await releaseGlobalSpend(reservation.periodKey, reservation.reservedCents);
      await logUsageEvent({ route, tool, outcome: 'provider_failed' });
    },
  };
}

module.exports = { guardPaidRoute };
