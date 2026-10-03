// All tunables come from env vars so behavior can be changed per-environment
// (local Windows testing vs. the Railway/Debian container) without code edits.
function parseApiKeys(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    console.error('API_KEYS is not valid JSON -- no keys loaded, every request will be rejected.');
  }
  return {};
}

function parseOrigins(raw) {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

module.exports = {
  PORT: Number(process.env.PORT) || 8080,
  API_KEYS: parseApiKeys(process.env.API_KEYS),
  ALLOWED_ORIGINS: parseOrigins(process.env.ALLOWED_ORIGINS),
  MAX_FILE_SIZE_BYTES: Number(process.env.MAX_FILE_SIZE_BYTES) || 50 * 1024 * 1024,
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS) || 60_000,
  GS_BIN: process.env.GS_BIN || 'gs',
  QPDF_BIN: process.env.QPDF_BIN || 'qpdf',
  VERAPDF_BIN: process.env.VERAPDF_BIN || 'verapdf',
  DEFAULT_PDFA_FLAVOUR: process.env.DEFAULT_PDFA_FLAVOUR || '2b',
  // /v1/compress (py/compress.py). PDFPY_BIN is set by the Dockerfile.
  PDFPY_BIN: process.env.PDFPY_BIN || 'python3',
  COMPRESS_TIMEOUT_MS: Number(process.env.COMPRESS_TIMEOUT_MS) || 270_000,
  MAX_COMPRESS_BYTES: Number(process.env.MAX_COMPRESS_BYTES) || 200 * 1024 * 1024,
  // Where staged files live. No default on purpose: without it /v1/compress-staged answers 503.
  MEDIA_SERVICE_URL: process.env.MEDIA_SERVICE_URL || '',
  // /v1/docx-to-doc (src/docConvert.js). Set by the Dockerfile; locally, the path of soffice.
  SOFFICE_BIN: process.env.SOFFICE_BIN || 'soffice',
  DOC_TIMEOUT_MS: Number(process.env.DOC_TIMEOUT_MS) || 120_000,
  // /v1/pdfa levels 2u/3u/2a/3a (P26): up to three conversions + veraPDF runs when a lower level is allowed.
  // P27: the PDF/A text check (src/pdfa.js) reads with Poppler too. Set by the Dockerfile's poppler-utils.
  PDFTOTEXT_BIN: process.env.PDFTOTEXT_BIN || 'pdftotext',
  // /v1/unicode-from-actualtext (P27): a pass over the content streams, before ConvertAPI.
  // (25 s: the site waits 30 s, so the service gives up first and frees its process)
  ACTUALTEXT_TIMEOUT_MS: Number(process.env.ACTUALTEXT_TIMEOUT_MS) || 25_000,
  PDFA_ADVANCED_TIMEOUT_MS: Number(process.env.PDFA_ADVANCED_TIMEOUT_MS) || 200_000,
  // /v1/repair (P28): Poppler's pdfunite is the second structural repair method (poppler-utils, like pdftotext), and
  // every repaired candidate's text is read back by two readers -- up to four repairs and ten text reads at worst.
  PDFUNITE_BIN: process.env.PDFUNITE_BIN || 'pdfunite',
  REPAIR_TIMEOUT_MS: Number(process.env.REPAIR_TIMEOUT_MS) || 200_000,
};
