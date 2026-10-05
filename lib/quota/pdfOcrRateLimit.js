const { incrementCountersAllOrNone } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { clientIpBucketId } = require('./ipHash');
const { PDF_OCR_PAGES_PER_HOUR, PDF_OCR_PAGES_PER_DAY, PDF_OCR_GLOBAL_PER_HOUR } = require('./config');

// P33 (05/10): pages recognized by pdf-tools for an iPhone / iPad (/api/pdf-ocr). Same shape as the page drawings of
// P32 (lib/quota/pdfRenderRateLimit.js): per visitor (hour, day) AND for all visitors together (hour), one atomic call.
async function checkPdfOcrRateLimit(req) {
  const id = clientIpBucketId(req);
  const hour = currentUtcHourKey();
  const { allowed, results } = await incrementCountersAllOrNone([
    { bucketKey: `pdf_ocr:hour:${id}`, periodKey: hour, amount: 1, cap: PDF_OCR_PAGES_PER_HOUR },
    { bucketKey: `pdf_ocr:day:${id}`, periodKey: currentUtcDayKey(), amount: 1, cap: PDF_OCR_PAGES_PER_DAY },
    { bucketKey: 'pdf_ocr:global:hour', periodKey: hour, amount: 1, cap: PDF_OCR_GLOBAL_PER_HOUR },
  ]);
  if (allowed) return { allowed: true };
  if (results[2].overCap && !results[0].overCap && !results[1].overCap) return { allowed: false, layer: 'global', retryAfterSeconds: secondsUntilNextUtcHour() };
  if (results[1].overCap && !results[0].overCap) return { allowed: false, layer: 'day', retryAfterSeconds: secondsUntilNextUtcDay() };
  return { allowed: false, layer: 'hour', retryAfterSeconds: secondsUntilNextUtcHour() };
}

module.exports = { checkPdfOcrRateLimit };
