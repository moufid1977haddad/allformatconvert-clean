const { createHash } = require('node:crypto');

function hashIp(ip) {
  return createHash('sha256').update(ip).digest('hex');
}

// req is a Next.js NextRequest (Headers has a .get method). Returns null if
// no forwarded-for header is present -- callers fall back to a shared
// 'unknown-ip' bucket rather than skipping the rate-limit check entirely.
function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (!xff) return null;
  const first = xff.split(',')[0].trim();
  return first || null;
}

module.exports = { hashIp, getClientIp };
