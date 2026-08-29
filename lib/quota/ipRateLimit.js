const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { hashIp, getClientIp } = require('./ipHash');
const { IP_RATE_LIMIT_PER_HOUR, IP_RATE_LIMIT_PER_DAY } = require('./config');

// One shared bucket per IP across all 16 tools + Background Remover (spec
// §5) -- not per-tool, so rotating between tools doesn't reset the count.
async function checkIpRateLimit(req) {
  const rawIp = getClientIp(req);
  const hash = rawIp ? hashIp(rawIp) : 'unknown-ip';
  const hourKey = currentUtcHourKey();
  const dayKey = currentUtcDayKey();
  const hourBucket = `ip_rate:hour:${hash}`;
  const dayBucket = `ip_rate:day:${hash}`;

  const hourResult = await incrementCounter(hourBucket, hourKey, 1, IP_RATE_LIMIT_PER_HOUR);
  if (!hourResult.allowed) {
    return { allowed: false, layer: 'ip_hour', retryAfterSeconds: secondsUntilNextUtcHour() };
  }

  const dayResult = await incrementCounter(dayBucket, dayKey, 1, IP_RATE_LIMIT_PER_DAY);
  if (!dayResult.allowed) {
    // A blocked attempt must never inflate the hourly count either.
    await decrementCounter(hourBucket, hourKey, 1);
    return { allowed: false, layer: 'ip_day', retryAfterSeconds: secondsUntilNextUtcDay() };
  }

  return { allowed: true };
}

module.exports = { checkIpRateLimit };
