const { incrementCountersAllOrNone } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { getClientIp, hashIp } = require('./ipHash');
const { URL_PDF_RATE_LIMIT_PER_HOUR, URL_PDF_RATE_LIMIT_PER_DAY, URL_PDF_GLOBAL_PER_HOUR } = require('./config');
const { isIPv6 } = require('node:net');

// P25 (03/10, E4): limits of HTML to PDF from a URL. Per visitor (hour, day) AND for all visitors together (hour),
// reserved in one atomic call like the other limits. An IPv6 visitor is counted by its /56 network, not its exact
// address: a home line often receives a /56 (256 × /64) and could otherwise rotate addresses (independent review 03/10).
function v6Prefix56(ip) {
  const s = ip.toLowerCase().split('%')[0];
  const [head, tail] = s.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined ? (tail ? tail.split(':') : []) : [];
  const words = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  const n = words.slice(0, 4).map((w) => parseInt(w, 16) || 0);
  n[3] &= 0xff00;
  return `${n.map((w) => w.toString(16)).join(':')}::/56`;
}

function visitorBucketId(req) {
  const ip = getClientIp(req);
  if (!ip) return 'unknown-ip';
  return hashIp(isIPv6(ip) && !/^::ffff:/i.test(ip) ? v6Prefix56(ip) : ip);
}

async function checkUrlPdfRateLimit(req) {
  const id = visitorBucketId(req);
  const hour = currentUtcHourKey();
  const { allowed, results } = await incrementCountersAllOrNone([
    { bucketKey: `url_pdf:hour:${id}`, periodKey: hour, amount: 1, cap: URL_PDF_RATE_LIMIT_PER_HOUR },
    { bucketKey: `url_pdf:day:${id}`, periodKey: currentUtcDayKey(), amount: 1, cap: URL_PDF_RATE_LIMIT_PER_DAY },
    { bucketKey: 'url_pdf:global:hour', periodKey: hour, amount: 1, cap: URL_PDF_GLOBAL_PER_HOUR },
  ]);
  if (allowed) return { allowed: true };
  if (results[1].overCap && !results[0].overCap && !results[2].overCap) return { allowed: false, layer: 'day', retryAfterSeconds: secondsUntilNextUtcDay() };
  return { allowed: false, layer: results[2].overCap && !results[0].overCap ? 'global' : 'hour', retryAfterSeconds: secondsUntilNextUtcHour() };
}

module.exports = { checkUrlPdfRateLimit, v6Prefix56 };
