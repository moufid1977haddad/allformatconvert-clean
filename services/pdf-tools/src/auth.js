const { API_KEYS } = require('./config');

// In-memory usage counters, keyed by API key. This resets on every deploy
// or container restart -- acceptable for now since there is exactly one
// real caller (our own site's Vercel proxy). A durable, restart-proof quota
// store is follow-up work for when a second (paying) API customer exists;
// see services/pdf-tools/README.md.
const usage = new Map();

function currentMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getUsage(apiKey) {
  const month = currentMonthKey();
  const entry = usage.get(apiKey);
  if (!entry || entry.month !== month) {
    const fresh = { month, requests: 0 };
    usage.set(apiKey, fresh);
    return fresh;
  }
  return entry;
}

// Express middleware: validates X-API-Key, enforces the key's monthly
// request quota, and attaches { name, quota, usage } to req.apiKey for
// downstream handlers (metrics logging needs the name, never the raw key).
function requireApiKey(req, res, next) {
  const key = req.header('X-API-Key');
  if (!key) {
    return res.status(401).json({ ok: false, error: 'Missing X-API-Key header.' });
  }
  const config = API_KEYS[key];
  if (!config) {
    return res.status(401).json({ ok: false, error: 'Invalid API key.' });
  }
  const usageEntry = getUsage(key);
  const quota = config.monthlyQuotaRequests ?? Infinity;
  if (usageEntry.requests >= quota) {
    return res.status(429).json({ ok: false, error: 'Monthly request quota exceeded for this API key.' });
  }
  usageEntry.requests += 1;
  req.apiKey = { name: config.name || 'unnamed', quota, requestsThisMonth: usageEntry.requests };
  next();
}

module.exports = { requireApiKey };
