const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { hashIp, getClientIp } = require('./ipHash');
const { TOOL_ERROR_RATE_LIMIT_PER_HOUR, TOOL_ERROR_RATE_LIMIT_PER_DAY } = require('./config');

// Own bucket prefix ('tool_error_rate:'), deliberately separate from
// ipRateLimit.js's 'ip_rate:' buckets -- see config.js's comment on why
// this must not share the paid-route budget.
async function checkToolErrorRateLimit(req) {
  const rawIp = getClientIp(req);
  const hash = rawIp ? hashIp(rawIp) : 'unknown-ip';
  const hourKey = currentUtcHourKey();
  const dayKey = currentUtcDayKey();
  const hourBucket = `tool_error_rate:hour:${hash}`;
  const dayBucket = `tool_error_rate:day:${hash}`;

  const hourResult = await incrementCounter(hourBucket, hourKey, 1, TOOL_ERROR_RATE_LIMIT_PER_HOUR);
  if (!hourResult.allowed) {
    return { allowed: false, retryAfterSeconds: secondsUntilNextUtcHour() };
  }

  const dayResult = await incrementCounter(dayBucket, dayKey, 1, TOOL_ERROR_RATE_LIMIT_PER_DAY);
  if (!dayResult.allowed) {
    await decrementCounter(hourBucket, hourKey, 1);
    return { allowed: false, retryAfterSeconds: secondsUntilNextUtcDay() };
  }

  return { allowed: true };
}

module.exports = { checkToolErrorRateLimit };
