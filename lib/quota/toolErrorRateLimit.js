const { incrementCountersAllOrNone } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { clientIpBucketId } = require('./ipHash');
const { TOOL_ERROR_RATE_LIMIT_PER_HOUR, TOOL_ERROR_RATE_LIMIT_PER_DAY, TOOL_ERROR_GLOBAL_PER_DAY } = require('./config');

// Own bucket prefix ('tool_error_rate:'), deliberately separate from
// ipRateLimit.js's 'ip_rate:' buckets -- see config.js's comment on why
// this must not share the paid-route budget. The visitor's hour and day and,
// since P25 (03/10), the site-wide day are reserved together, atomically: a
// refused report raises none of the three (as hourDayRateLimit.js does for two).
async function checkToolErrorRateLimit(req) {
  const id = clientIpBucketId(req);
  const day = currentUtcDayKey();
  const { allowed, results } = await incrementCountersAllOrNone([
    { bucketKey: `tool_error_rate:hour:${id}`, periodKey: currentUtcHourKey(), amount: 1, cap: TOOL_ERROR_RATE_LIMIT_PER_HOUR },
    { bucketKey: `tool_error_rate:day:${id}`, periodKey: day, amount: 1, cap: TOOL_ERROR_RATE_LIMIT_PER_DAY },
    { bucketKey: 'tool_error_rate:global:day', periodKey: day, amount: 1, cap: TOOL_ERROR_GLOBAL_PER_DAY },
  ]);
  if (allowed) return { allowed: true };
  if (results[0].overCap && !results[1].overCap && !results[2].overCap) return { allowed: false, retryAfterSeconds: secondsUntilNextUtcHour() };
  return { allowed: false, retryAfterSeconds: secondsUntilNextUtcDay() };
}

module.exports = { checkToolErrorRateLimit };
