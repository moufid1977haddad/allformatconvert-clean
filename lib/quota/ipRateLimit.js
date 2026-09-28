const { checkHourDayRateLimit } = require('./hourDayRateLimit');
const { IP_RATE_LIMIT_PER_HOUR, IP_RATE_LIMIT_PER_DAY } = require('./config');

// One shared bucket per IP across all 16 tools + Background Remover (spec
// §5) -- not per-tool, so rotating between tools doesn't reset the count.
// Hour and day are reserved together, atomically (see hourDayRateLimit.js).
async function checkIpRateLimit(req) {
  const r = await checkHourDayRateLimit(req, { prefix: 'ip_rate', perHour: IP_RATE_LIMIT_PER_HOUR, perDay: IP_RATE_LIMIT_PER_DAY });
  if (r.allowed) return { allowed: true };
  return { allowed: false, layer: r.layer === 'hour' ? 'ip_hour' : 'ip_day', retryAfterSeconds: r.retryAfterSeconds };
}

module.exports = { checkIpRateLimit };
