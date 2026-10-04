const { incrementCountersAllOrNone } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { clientIpBucketId } = require('./ipHash');
const { PDF_RENDER_PAGES_PER_HOUR, PDF_RENDER_PAGES_PER_DAY, PDF_RENDER_GLOBAL_PER_HOUR } = require('./config');

// P32 (04/10): pages drawn by pdf-tools for an iPhone / iPad (/api/pdf-render). Per visitor (hour, day) AND for all
// visitors together (hour) — independent review 04/10: nothing on the server reserves the route to iPhones, so a visitor
// rotating addresses must not turn it into a free rendering API that leaves the real iPhone visitors with "busy".
// One atomic call, like the other limits: either all three go up, or none.
async function checkPdfRenderRateLimit(req) {
  const id = clientIpBucketId(req);
  const hour = currentUtcHourKey();
  const { allowed, results } = await incrementCountersAllOrNone([
    { bucketKey: `pdf_render:hour:${id}`, periodKey: hour, amount: 1, cap: PDF_RENDER_PAGES_PER_HOUR },
    { bucketKey: `pdf_render:day:${id}`, periodKey: currentUtcDayKey(), amount: 1, cap: PDF_RENDER_PAGES_PER_DAY },
    { bucketKey: 'pdf_render:global:hour', periodKey: hour, amount: 1, cap: PDF_RENDER_GLOBAL_PER_HOUR },
  ]);
  if (allowed) return { allowed: true };
  if (results[2].overCap && !results[0].overCap && !results[1].overCap) return { allowed: false, layer: 'global', retryAfterSeconds: secondsUntilNextUtcHour() };
  if (results[1].overCap && !results[0].overCap) return { allowed: false, layer: 'day', retryAfterSeconds: secondsUntilNextUtcDay() };
  return { allowed: false, layer: 'hour', retryAfterSeconds: secondsUntilNextUtcHour() };
}

module.exports = { checkPdfRenderRateLimit };
