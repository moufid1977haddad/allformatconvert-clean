const { checkHourDayRateLimit } = require('./hourDayRateLimit');
const { TOOL_ERROR_RATE_LIMIT_PER_HOUR, TOOL_ERROR_RATE_LIMIT_PER_DAY } = require('./config');

// Own bucket prefix ('tool_error_rate:'), deliberately separate from
// ipRateLimit.js's 'ip_rate:' buckets -- see config.js's comment on why
// this must not share the paid-route budget. Hour and day are reserved
// together, atomically (see hourDayRateLimit.js).
async function checkToolErrorRateLimit(req) {
  const r = await checkHourDayRateLimit(req, { prefix: 'tool_error_rate', perHour: TOOL_ERROR_RATE_LIMIT_PER_HOUR, perDay: TOOL_ERROR_RATE_LIMIT_PER_DAY });
  return r.allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: r.retryAfterSeconds };
}

module.exports = { checkToolErrorRateLimit };
