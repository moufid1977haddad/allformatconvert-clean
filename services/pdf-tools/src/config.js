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
};
