// Upload tickets for the media-processing service (services/media-processing).
//
// The browser sends a file DIRECTLY to the processing service (a video never
// transits a Vercel function: the platform ceiling is ~4.4 MB). What lets the
// service trust that upload is a short-lived ticket minted here, AFTER this
// site's own rate-limit check:
//
//   v1.<base64url(json payload)>.<base64url(HMAC-SHA256(secret, payload part))>
//   payload = { jid, op, max, exp }
//
// One ticket authorises exactly one job id for a few minutes. The secret is
// shared with the service (MEDIA_TICKET_SECRET on both sides) and never
// reaches the browser. This file is pure (no I/O) so it is unit-tested without
// a database: scripts/media-tests/ticket.test.mjs.
const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

// 'stage' = a document (Office / HTML / PDF) sent to the service only so that a Vercel route can read it
// server-to-server, convert it and deposit the result back (see lib/media/staged.js).
const OPS = ['convert', 'compress', 'stage'];
const SERVER_TICKET_TTL_SECONDS = 10 * 60;
const TICKET_TTL_SECONDS = 15 * 60;

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function mintTicket({ secret, op, maxBytes, now = Date.now(), jid, role }) {
  const id = jid || randomBytes(16).toString('hex');
  const payload = { jid: id, op, max: maxBytes, exp: Math.floor(now / 1000) + (role === 'server' ? SERVER_TICKET_TTL_SECONDS : TICKET_TTL_SECONDS) };
  if (role) payload.role = role;
  const body = b64url(JSON.stringify(payload));
  const mac = b64url(createHmac('sha256', secret).update(body).digest());
  return { jid: id, ticket: `v1.${body}.${mac}`, expiresAt: payload.exp };
}

// Reads the configuration lazily (at request time, not import time), so a
// missing variable makes THIS route answer 503 with the variable NAMES, and
// never breaks the build of the rest of the site. No value has a default.
function readConfig(env = process.env) {
  const missing = [];
  const secret = env.MEDIA_TICKET_SECRET;
  if (!secret) missing.push('MEDIA_TICKET_SECRET');
  const num = (name) => {
    const n = Number(env[name]);
    if (!Number.isInteger(n) || n <= 0) { missing.push(name); return 0; }
    return n;
  };
  const maxBytes = num('MEDIA_TICKET_MAX_BYTES');
  const perHour = num('MEDIA_JOBS_PER_HOUR_PER_IP');
  const perDay = num('MEDIA_JOBS_PER_DAY_PER_IP');
  return missing.length ? { ok: false, missing } : { ok: true, secret, maxBytes, perHour, perDay };
}

// Validates the request body. Returns { ok:true, op, size } or { ok:false, status, error }.
function validateRequest(body, maxBytes) {
  const op = body && body.op;
  const size = body && body.size;
  if (!OPS.includes(op)) return { ok: false, status: 400, error: 'Unsupported operation.' };
  if (!Number.isInteger(size) || size <= 0) return { ok: false, status: 400, error: 'The file size is required.' };
  if (size > maxBytes) {
    return { ok: false, status: 413, error: `Files up to ${Math.floor(maxBytes / 1048576)} MB are accepted.` };
  }
  return { ok: true, op, size };
}

// Checks a ticket the browser handed back to a route (signature in constant time, expiry, shape).
// Returns the payload, or null. Never throws.
function verifyTicket(ticket, secret, now = Date.now()) {
  try {
    const parts = String(ticket || '').split('.');
    if (parts.length !== 3 || parts[0] !== 'v1') return null;
    const expected = createHmac('sha256', secret).update(parts[1]).digest();
    const given = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    const p = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    if (typeof p.jid !== 'string' || !/^[0-9a-zA-Z]{16,64}$/.test(p.jid) || typeof p.op !== 'string') return null;
    if (!Number.isInteger(p.exp) || p.exp * 1000 < now) return null;
    return { jid: p.jid, op: p.op, max: p.max, exp: p.exp, role: p.role || 'browser' };
  } catch {
    return null;
  }
}

module.exports = { mintTicket, verifyTicket, readConfig, validateRequest, TICKET_TTL_SECONDS, SERVER_TICKET_TTL_SECONDS, OPS };
