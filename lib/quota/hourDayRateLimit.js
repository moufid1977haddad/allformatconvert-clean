const { incrementCountersAllOrNone } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { clientIpBucketId } = require('./ipHash');

// Hourly + daily limit for one visitor, under `${prefix}:hour:<id>` and
// `${prefix}:day:<id>`. Both counters are taken in ONE atomic RPC: either
// both go up, or neither does -- a blocked attempt never inflates the other
// counter, and there is no separate compensating decrement that a network
// error could skip. When both are over, the hour layer is reported (as the
// earlier two-call version did, since it checked the hour first).
async function checkHourDayRateLimit(req, { prefix, perHour, perDay }) {
  const id = clientIpBucketId(req);
  const { allowed, results } = await incrementCountersAllOrNone([
    { bucketKey: `${prefix}:hour:${id}`, periodKey: currentUtcHourKey(), amount: 1, cap: perHour },
    { bucketKey: `${prefix}:day:${id}`, periodKey: currentUtcDayKey(), amount: 1, cap: perDay },
  ]);
  if (allowed) return { allowed: true };
  if (results[0].overCap || !results[1].overCap) {
    return { allowed: false, layer: 'hour', retryAfterSeconds: secondsUntilNextUtcHour() };
  }
  return { allowed: false, layer: 'day', retryAfterSeconds: secondsUntilNextUtcDay() };
}

module.exports = { checkHourDayRateLimit };
