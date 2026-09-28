const { checkHourDayRateLimit } = require('./hourDayRateLimit');
const { CONTACT_RATE_LIMIT_PER_HOUR, CONTACT_RATE_LIMIT_PER_DAY } = require('./config');

// Own bucket prefix ('contact_rate:'), separate from ip_rate: and
// tool_error_rate: -- see config.js for why this route needs its own,
// tighter cap. Hour and day are reserved together, atomically (see
// hourDayRateLimit.js).
async function checkContactRateLimit(req) {
  const r = await checkHourDayRateLimit(req, { prefix: 'contact_rate', perHour: CONTACT_RATE_LIMIT_PER_HOUR, perDay: CONTACT_RATE_LIMIT_PER_DAY });
  return r.allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: r.retryAfterSeconds };
}

module.exports = { checkContactRateLimit };
