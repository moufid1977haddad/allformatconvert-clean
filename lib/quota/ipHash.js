const { createHash } = require('node:crypto');
const { isIP } = require('node:net');

function hashIp(ip) {
  return createHash('sha256').update(ip).digest('hex');
}

// The one place the visitor's IP is read for limits and quotas.
//
// Source: `x-real-ip`, set by Vercel's proxy. Vercel documents that it
// overwrites X-Forwarded-For "to prevent IP spoofing" and that x-real-ip "is
// identical to the x-forwarded-for header"
// (https://vercel.com/docs/headers/request-headers); @vercel/functions'
// ipAddress() reads exactly this header ("Client IP as calculated by Vercel
// Proxy"). We read it directly rather than adding that package for one line.
//
// x-forwarded-for is deliberately NOT read: outside Vercel's overwrite it is
// a client-supplied, multi-hop list whose first element anyone can forge.
// The value must be one well-formed IP address; anything else (a list, junk)
// is treated as absent.
//
// Returns null when there is no usable value (e.g. local `next dev`, which is
// not behind Vercel's proxy): callers then use the shared 'unknown-ip' bucket
// rather than skipping the limit -- the existing, documented behavior.
const CLIENT_IP_HEADER = 'x-real-ip';

function getClientIp(req) {
  const raw = req.headers.get(CLIENT_IP_HEADER);
  if (!raw) return null;
  const ip = raw.trim();
  return isIP(ip) ? ip : null;
}

// Bucket id for per-visitor counters: the IP's hash, or the shared 'unknown-ip'.
function clientIpBucketId(req) {
  const ip = getClientIp(req);
  return ip ? hashIp(ip) : 'unknown-ip';
}

module.exports = { hashIp, getClientIp, clientIpBucketId, CLIENT_IP_HEADER };
