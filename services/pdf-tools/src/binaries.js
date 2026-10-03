const { runProcess } = require('./runProcess');
const { GS_BIN, QPDF_BIN, VERAPDF_BIN, PDFPY_BIN, SOFFICE_BIN, PDFTOTEXT_BIN } = require('./config');

async function checkBinary(bin, args, signal) {
  try {
    const result = await runProcess(bin, args, { signal });
    if (result.aborted) return { ok: false, detail: 'timeout' };
    if (result.code !== 0) return { ok: false, detail: `exit_${result.code}` };
    const version = (result.stdout || result.stderr).trim().split(/\r?\n/)[0];
    return { ok: true, version };
  } catch (err) {
    return { ok: false, detail: err.code === 'ENOENT' ? 'not_found' : (err.message || 'error') };
  }
}

// soffice --version starts LibreOffice (1-2 s): read once, then remembered -- /health is polled.
let sofficeVersion = null;
async function checkSoffice() {
  if (sofficeVersion) return sofficeVersion;
  // bounded: a health check must never hang on a stuck LibreOffice start
  const r = await checkBinary(SOFFICE_BIN, ['--version'], AbortSignal.timeout(15000));
  if (r.ok) sofficeVersion = r;
  return r;
}

async function checkAllBinaries() {
  const [gs, qpdf, verapdf, pdfpy, tx, soffice, pdftotext] = await Promise.all([
    checkBinary(GS_BIN, ['--version']),
    checkBinary(QPDF_BIN, ['--version']),
    checkBinary(VERAPDF_BIN, ['--version']),
    // /v1/compress: the Python stack and Adobe's tx (py/compress.py)
    checkBinary(PDFPY_BIN, ['-c', 'import pikepdf, PIL, fontTools; print("pikepdf", pikepdf.__version__)']),
    checkBinary('tx', ['-v']),
    // /v1/docx-to-doc (P26, E1)
    checkSoffice(),
    // /v1/pdfa text check (P27): no PDF/A file is delivered without it
    checkBinary(PDFTOTEXT_BIN, ['-v']),
  ]);
  return { ghostscript: gs, qpdf, verapdf, pdfpy, tx, soffice, pdftotext };
}

module.exports = { checkAllBinaries };
