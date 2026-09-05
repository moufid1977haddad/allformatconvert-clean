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
/** @returns {Promise<{ok:false,response:import('next/server').NextResponse}|{ok:true,commit:(actualCostMicros?:number|null,sendAlertFn?:(service:string,status:string)=>Promise<void>)=>Promise<void>,release:(sendAlertFn?:(service:string,status:string)=>Promise<void>)=>Promise<void>}>} */
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
    // actualCostMicros has three meaningful states, and they must NOT be
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
    async commit(actualCostMicros, sendAlertFn = sendAlert) {
      if (settled) return;
      settled = true;

      // The actual reconcile-and-log work, extracted so it can be retried
      // verbatim on failure -- see the retry comment below for the one
      // known edge case this creates.
      const attempt = async () => {
        if (typeof actualCostMicros === 'number') {
          await reconcileGlobalSpend(reservation.periodKey, reservation.reservedMicros, actualCostMicros);
          await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostMicros: actualCostMicros });
        } else if (actualCostMicros === null) {
          // Mirrors globalSpend.js's safeCheckAndAlertThresholds: alerting is
          // best-effort and must never be allowed to block the logUsageEvent
          // call below -- that log row is the exact incident record this
          // fix exists to make visible, so it must still be written even if
          // sendAlertFn itself throws (e.g. a future change to sendAlert, or
          // a test stub that throws).
          try {
            await sendAlertFn('quota-cost-unknown', tool ? `${route}:${tool}` : route);
          } catch (err) {
            console.error('quota-cost-unknown alert failed (non-fatal, usage event still logged):', err.message);
          }
          await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostMicros: reservation.reservedMicros });
        } else {
          await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostMicros: reservation.reservedMicros });
        }
      };

      try {
        await attempt();
      } catch (firstErr) {
        console.error('guard.commit() failed once, retrying:', firstErr.message);
        // The provider call has already succeeded at this point -- a real
        // cost has already been incurred (or is already known to be at
        // least the worst-case reservation). A transient DB blip is the
        // expected cause of a failure here, so retry the exact same
        // attempt once before treating it as a real incident.
        //
        // Known, accepted limitation: attempt() is retried as a whole, not
        // step-by-step. In the current codebase this only matters if
        // reconcileGlobalSpend() itself is the thing that throws (it's the
        // only call in attempt() that can -- logUsageEvent() swallows its
        // own errors and never rethrows, see logEvent.js), so a partial
        // "reconcile succeeded, only the log failed" split doesn't actually
        // occur today. This is still deliberately not given a more granular
        // retry, in case a future change makes logUsageEvent() (or anything
        // else in attempt()) able to throw after reconcileGlobalSpend()
        // already succeeded: the failure mode a whole-attempt retry would
        // then risk is the counter reading *higher* than true spend (an
        // over-reservation), never lower -- the same safe-direction bias
        // this file already applies everywhere else (worst-case
        // reservations, clamped-at-zero counters). The alternative failure
        // mode -- undercounting a real cost -- is the one this function
        // exists to prevent.
        try {
          await attempt();
        } catch (secondErr) {
          // Both attempts failed. The reservation MUST NOT be released: the
          // provider call already succeeded (or the cost is already known
          // to be at least the worst-case reservation), so releasing it
          // would silently undercount real spend -- the one outcome this
          // function is not allowed to produce. Leave the worst-case
          // reservation exactly as reserveGlobalSpend applied it (nothing
          // more to do here), and alert loudly so a human reconciles
          // usage_counters by hand.
          const detail = `${route}${tool ? ':' + tool : ''} periodKey=${reservation.periodKey} reservedMicros=${reservation.reservedMicros} error=${secondErr.message}`;
          try {
            await sendAlertFn('quota-commit-failed', detail);
          } catch (alertErr) {
            console.error('quota-commit-failed alert failed (non-fatal):', alertErr.message);
          }
          console.error('guard.commit() failed twice, reservation kept in place:', detail);
        }
      }
    },
    async release(sendAlertFn = sendAlert) {
      if (settled) return;
      settled = true;

      // Same shape as commit()'s attempt/retry above, extracted so it can
      // be retried verbatim on failure.
      const attempt = async () => {
        await releaseGlobalSpend(reservation.periodKey, reservation.reservedMicros);
        await logUsageEvent({ route, tool, outcome: 'provider_failed' });
      };

      try {
        await attempt();
      } catch (firstErr) {
        console.error('guard.release() failed once, retrying:', firstErr.message);
        // A transient DB blip is the expected cause of a failure here too --
        // retry the exact same attempt once before treating it as a real
        // incident, mirroring commit()'s retry-once policy exactly.
        try {
          await attempt();
        } catch (secondErr) {
          // Both attempts failed. Unlike commit()'s double-failure case,
          // this reservation does NOT correspond to any real spend: the
          // provider call failed (or never happened), so the worst-case
          // amount reserveGlobalSpend reserved was never actually
          // incurred. Because releaseGlobalSpend() itself is what failed,
          // that amount is still sitting in global_spend_microusd,
          // overstating real spend by reservedMicros -- recoverable money,
          // not a cost to pay. The alert message says so explicitly so
          // whoever reads it doesn't mistake this for quota-commit-failed's
          // "real spend, don't undercount" situation and leave it alone.
          const detail = `${route}${tool ? ':' + tool : ''} periodKey=${reservation.periodKey} reservedMicros=${reservation.reservedMicros} error=${secondErr.message} -- this amount was NEVER actually spent (the provider call failed); global_spend_microusd is overstated by reservedMicros and should be manually decremented once Supabase is healthy again`;
          try {
            await sendAlertFn('quota-release-failed', detail);
          } catch (alertErr) {
            console.error('quota-release-failed alert failed (non-fatal):', alertErr.message);
          }
          console.error('guard.release() failed twice, reservation stuck (not real spend):', detail);
        }
      }
    },
  };
}

module.exports = { guardPaidRoute };
