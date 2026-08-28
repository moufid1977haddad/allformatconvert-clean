const { ALLOWED_ORIGINS } = require('./config');

// Restrictive by design: only echoes the Origin header back (which is what
// actually allows the browser to read the response) when it exactly matches
// one of our configured origins. Any other origin gets no CORS headers at
// all, so the browser blocks the response -- this is the "restreint à notre
// domaine" requirement. Requests with no Origin header (server-to-server,
// curl, a future API customer's backend) are never subject to CORS in the
// first place, so this only affects browser callers.
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

module.exports = { corsMiddleware };
