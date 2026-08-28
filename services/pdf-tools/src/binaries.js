const { runProcess } = require('./runProcess');
const { GS_BIN, QPDF_BIN, VERAPDF_BIN } = require('./config');

async function checkBinary(bin, args) {
  try {
    const result = await runProcess(bin, args);
    if (result.code !== 0) return { ok: false, detail: `exit_${result.code}` };
    const version = (result.stdout || result.stderr).trim().split(/\r?\n/)[0];
    return { ok: true, version };
  } catch (err) {
    return { ok: false, detail: err.code === 'ENOENT' ? 'not_found' : (err.message || 'error') };
  }
}

async function checkAllBinaries() {
  const [gs, qpdf, verapdf] = await Promise.all([
    checkBinary(GS_BIN, ['--version']),
    checkBinary(QPDF_BIN, ['--version']),
    checkBinary(VERAPDF_BIN, ['--version']),
  ]);
  return { ghostscript: gs, qpdf, verapdf };
}

module.exports = { checkAllBinaries };
