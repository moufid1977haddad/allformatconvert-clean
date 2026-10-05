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
  // /v1/render-page (P32, src/render.js): one page -> one image, for an iPhone / iPad that could not draw it.
  // poppler-utils (Dockerfile) brings pdftoppm and pdfinfo. The site waits 55 s, so the service gives up first.
  PDFTOPPM_BIN: process.env.PDFTOPPM_BIN || 'pdftoppm',
  PDFINFO_BIN: process.env.PDFINFO_BIN || 'pdfinfo',
  RENDER_TIMEOUT_MS: Number(process.env.RENDER_TIMEOUT_MS) || 50_000,
  // the staged file of a render is a PDF the site accepts for its pdf-tools (MAX_PDFTOOLS_STAGED_BYTES, 44 MB)
  MAX_RENDER_INPUT_BYTES: Number(process.env.MAX_RENDER_INPUT_BYTES) || 44 * 1024 * 1024,
  MAX_RENDER_PIXELS: Number(process.env.MAX_RENDER_PIXELS) || 40_000_000,
  // the image goes back through a Vercel function (answer ceiling ~4.5 MB)
  MAX_RENDER_OUTPUT_BYTES: Number(process.env.MAX_RENDER_OUTPUT_BYTES) || 4_000_000,
  RENDER_CONCURRENCY: Number(process.env.RENDER_CONCURRENCY) || 2,
  RENDER_QUEUE_MS: Number(process.env.RENDER_QUEUE_MS) || 20_000,
  // address space of one pdfinfo / pdftoppm (Linux only, via prlimit): a 40 MP page takes ~160 MB in Splash
  RENDER_MEMORY_LIMIT_BYTES: process.env.RENDER_MEMORY_LIMIT_BYTES === undefined ? 1536 * 1024 * 1024 : Number(process.env.RENDER_MEMORY_LIMIT_BYTES),
  PRLIMIT_BIN: process.env.PRLIMIT_BIN || 'prlimit',
  // /v1/ocr-page (P33, src/ocr.js): one page recognized by Tesseract for an iPhone / iPad whose browser could not.
  // The Dockerfile installs tesseract-ocr and one model per language the site offers. The site waits 55 s.
  TESSERACT_BIN: process.env.TESSERACT_BIN || 'tesseract',
  OCR_TIMEOUT_MS: Number(process.env.OCR_TIMEOUT_MS) || 50_000,
  // an A4 page at 300 dpi is 8.7 MP; a larger page is recognized at the density that fits (and the answer says so).
  // Security review 05/10: Tesseract measured ~0.7 GB resident on a dense 25 MP page (eng), ~1 GB with three
  // languages, in a container shared with LibreOffice, Ghostscript and the renders: 12 MP, one recognition at a time.
  OCR_MAX_PIXELS: Number(process.env.OCR_MAX_PIXELS) || 12_000_000,
  // Tesseract's text-only PDF of one page (an invisible text layer, a few KB to a few hundred) and the text, as JSON
  MAX_OCR_OUTPUT_BYTES: Number(process.env.MAX_OCR_OUTPUT_BYTES) || 2_500_000,
  OCR_CONCURRENCY: Number(process.env.OCR_CONCURRENCY) || 1,
  OCR_QUEUE_MS: Number(process.env.OCR_QUEUE_MS) || 20_000,
  // the whole JSON answer (text + base64 layer) must come back through a Vercel function (~4.5 MB)
  MAX_OCR_ANSWER_BYTES: Number(process.env.MAX_OCR_ANSWER_BYTES) || 4_200_000,
  // staged sources (render and OCR) copied from the media service at the same time (security review 05/10: each copy
  // is up to 44 MB in /tmp, taken BEFORE the render/OCR slot; unbounded, parallel requests could fill the disk)
  STAGED_FETCH_CONCURRENCY: Number(process.env.STAGED_FETCH_CONCURRENCY) || 4,
  STAGED_FETCH_QUEUE_MS: Number(process.env.STAGED_FETCH_QUEUE_MS) || 20_000,
};
