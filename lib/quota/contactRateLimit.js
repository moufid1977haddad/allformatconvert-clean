const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { hashIp, getClientIp } = require('./ipHash');
const { CONTACT_RATE_LIMIT_PER_HOUR, CONTACT_RATE_LIMIT_PER_DAY } = require('./config');

// Own bucket prefix ('contact_rate:'), separate from ip_rate: and
// tool_error_rate: -- see config.js for why this route needs its own,
// tighter cap.
async function checkContactRateLimit(req) {
  const rawIp = getClientIp(req);
  const hash = rawIp ? hashIp(rawIp) : 'unknown-ip';
  const hourKey = currentUtcHourKey();
  const dayKey = currentUtcDayKey();
  const hourBucket = `contact_rate:hour:${hash}`;
  const dayBucket = `contact_rate:day:${hash}`;

  const hourResult = await incrementCounter(hourBucket, hourKey, 1, CONTACT_RATE_LIMIT_PER_HOUR);
  if (!hourResult.allowed) {
    return { allowed: false, retryAfterSeconds: secondsUntilNextUtcHour() };
  }

  const dayResult = await incrementCounter(dayBucket, dayKey, 1, CONTACT_RATE_LIMIT_PER_DAY);
  if (!dayResult.allowed) {
    await decrementCounter(hourBucket, hourKey, 1);
    return { allowed: false, retryAfterSeconds: secondsUntilNextUtcDay() };
  }

  return { allowed: true };
}

module.exports = { checkContactRateLimit };
