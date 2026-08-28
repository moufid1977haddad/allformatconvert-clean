const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const { QPDF_BIN, GS_BIN } = require('./config');

const INPUT_NAME = 'input.pdf';
const QPDF_OUT_NAME = 'qpdf-out.pdf';
const GS_OUT_NAME = 'gs-out.pdf';

// Every child process below runs with cwd set to the request's own temp dir
// and is given only relative filenames -- qpdf and Ghostscript both embed
// the path they were given into their own warning/error text, and that text
// is returned to the caller as the repair report. Relative names keep that
// report from leaking the server's absolute temp-directory layout.

// qpdf's own exit codes: 0 = success, no warnings. 3 = succeeded, but with
// warnings (this is the normal outcome for a file with a damaged xref table
// -- qpdf's default behavior, with no special flag needed, is to attempt
// reconstruction rather than fail). 2 = qpdf could not produce output at all.
async function tryQpdfRepair(workDir, signal) {
  let result;
  try {
    result = await runProcess(QPDF_BIN, [INPUT_NAME, QPDF_OUT_NAME], { cwd: workDir, signal });
  } catch (err) {
    return { succeeded: false, warnings: [], exitCode: null, spawnError: err.code || err.message };
  }
  const warnings = result.stderr
    .split(/\r?\n/)
    .filter((l) => l.startsWith('WARNING:'))
    .slice(0, 20);
  const succeeded = (result.code === 0 || result.code === 3) && fs.existsSync(path.join(workDir, QPDF_OUT_NAME));
  return { succeeded, warnings, exitCode: result.code };
}

// Ghostscript rewrites the PDF from scratch by reinterpreting its content
// streams -- more aggressive than qpdf's structural repair, and able to
// salvage files qpdf gives up on, at the cost of being a lossier rewrite
// (fonts/images get re-embedded rather than copied byte-for-byte).
async function tryGhostscriptRepair(workDir, signal) {
  let result;
  try {
    result = await runProcess(
      GS_BIN,
      ['-o', GS_OUT_NAME, '-sDEVICE=pdfwrite', '-dPDFSTOPONERROR=false', INPUT_NAME],
      { cwd: workDir, signal }
    );
  } catch (err) {
    // A spawn-level failure (binary missing, permissions, etc.) is a
    // failed repair attempt, not a server error -- repairPdf below reports
    // it as part of an honest "could not recover this file" response.
    return { succeeded: false, exitCode: null, stderr: `Ghostscript could not be started: ${err.code || err.message}` };
  }
  const outPath = path.join(workDir, GS_OUT_NAME);
  const succeeded = result.code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 0;
  return { succeeded, exitCode: result.code, stderr: result.stderr.slice(-2000) };
}

async function getPageCount(workDir, name, signal) {
  try {
    const result = await runProcess(QPDF_BIN, ['--show-npages', name], { cwd: workDir, signal });
    const n = parseInt(result.stdout.trim(), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

// Confirms the repaired file actually opens cleanly -- a Ghostscript rewrite
// in particular can technically "succeed" (exit 0) while still producing a
// file that doesn't stand up to re-parsing.
async function verifyOpens(workDir, name, signal) {
  try {
    const result = await runProcess(QPDF_BIN, ['--check', name], { cwd: workDir, signal });
    return result.code === 0 || result.code === 3;
  } catch {
    return false;
  }
}

// Repairs a PDF using qpdf first (precise, preserves content exactly), then
// falls back to Ghostscript's full rewrite only if qpdf couldn't produce a
// usable file. Returns a structured, honest report of what was actually
// done -- never a blanket "fixed!" claim.
async function repairPdf(workDir, signal) {
  const qpdfAttempt = await tryQpdfRepair(workDir, signal);

  if (qpdfAttempt.succeeded) {
    const pageCount = await getPageCount(workDir, QPDF_OUT_NAME, signal);
    return {
      ok: true,
      method: 'qpdf',
      warnings: qpdfAttempt.warnings,
      pageCount,
      outputPath: path.join(workDir, QPDF_OUT_NAME),
    };
  }

  const gsAttempt = await tryGhostscriptRepair(workDir, signal);

  if (gsAttempt.succeeded && (await verifyOpens(workDir, GS_OUT_NAME, signal))) {
    const pageCount = await getPageCount(workDir, GS_OUT_NAME, signal);
    return {
      ok: true,
      method: 'ghostscript',
      warnings: [
        'qpdf could not repair this file structurally; Ghostscript rewrote it from its content streams instead.',
        'This is a lossier repair: fonts and images were re-embedded rather than copied as-is.',
      ],
      pageCount,
      outputPath: path.join(workDir, GS_OUT_NAME),
    };
  }

  return {
    ok: false,
    error: 'This file is too damaged to recover. Both qpdf (structural repair) and Ghostscript (content-stream rewrite) failed to produce a valid PDF.',
    qpdfExitCode: qpdfAttempt.exitCode,
    ghostscriptExitCode: gsAttempt.exitCode,
  };
}

module.exports = { repairPdf };
