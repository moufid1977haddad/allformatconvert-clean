const { NextResponse } = require('next/server');
const { checkIpRateLimit } = require('./ipRateLimit');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('./globalSpend');
const { logUsageEvent } = require('./logEvent');
const { secondsUntilNextUtcMonth, nextUtcMonthIso } = require('./period');

// Wraps the 4 shared OpenAI/remove.bg routes. Order: Couche C (IP) first,
// then Couche A (global spend) -- a blocked IP attempt never reaches the
// spend reservation, but a request that clears the IP check still counts
// against the IP bucket even if it's then blocked by the spend cap (so a
// flood during a maxed-out month is still rate-limited, which is exactly
// when Couche C matters most).
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

  return {
    ok: true,
    async commit(actualCostCents) {
      if (typeof actualCostCents === 'number') {
        await reconcileGlobalSpend(reservation.periodKey, reservation.reservedCents, actualCostCents);
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: actualCostCents });
      } else {
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: reservation.reservedCents });
      }
    },
    async release() {
      await releaseGlobalSpend(reservation.periodKey, reservation.reservedCents);
      await logUsageEvent({ route, tool, outcome: 'provider_failed' });
    },
  };
}

module.exports = { guardPaidRoute };
