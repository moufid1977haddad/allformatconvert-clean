const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const { GS_BIN, VERAPDF_BIN } = require('./config');

// Vendored, unmodified, from this machine's own Ghostscript 10.07.1 install
// (lib/PDFA_def.ps and iccprofiles/srgb.icc) -- these ship as part of
// Ghostscript's own distribution (AGPL), not authored by us.
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const PDFA_DEF_PS = path.join(ASSETS_DIR, 'PDFA_def.ps');
const SRGB_ICC = path.join(ASSETS_DIR, 'srgb.icc');

const INPUT_NAME = 'input.pdf';
const OUTPUT_NAME = 'output.pdf';
const ICC_NAME = 'srgb.icc';

// Ghostscript's -dPDFA switch only takes the numeric part (1/2/3); it always
// targets the "b" (basic) conformance variant -- it cannot produce "a"
// (accessible/tagged) structure, so this service only ever offers 1b/2b/3b.
function levelDigit(conformance) {
  return conformance[0];
}

// Runs with cwd set to the request's own temp dir and relative filenames --
// same reasoning as repair.js: Ghostscript/veraPDF can embed the paths
// they're given into their own messages, and those messages flow into the
// response, so relative names keep the server's temp-directory layout from
// leaking. PDFA_def.ps is a fixed asset shipped with this service (not
// request-specific), so it's referenced by its real absolute path.
async function convertWithGhostscript(workDir, conformance, signal) {
  // PDFA_def.ps hardcodes "srgb.icc" as a bare relative filename, resolved
  // against Ghostscript's current directory -- so a copy has to sit next to
  // input.pdf in this request's own temp dir rather than being referenced
  // by its real (shared, asset-directory) path.
  fs.copyFileSync(SRGB_ICC, path.join(workDir, ICC_NAME));

  const args = [
    `-dPDFA=${levelDigit(conformance)}`,
    '-dBATCH',
    '-dNOPAUSE',
    '-dNOOUTERSAVE',
    '-sColorConversionStrategy=UseDeviceIndependentColor',
    '-sProcessColorModel=DeviceRGB',
    '-sDEVICE=pdfwrite',
    '-dPDFACompatibilityPolicy=1',
    `-sOutputFile=${OUTPUT_NAME}`,
    PDFA_DEF_PS,
    INPUT_NAME,
  ];
  let result;
  try {
    result = await runProcess(GS_BIN, args, { cwd: workDir, signal });
  } catch (err) {
    return { succeeded: false, exitCode: null, stderr: `Ghostscript could not be started: ${err.code || err.message}` };
  }
  const outPath = path.join(workDir, OUTPUT_NAME);
  const succeeded = result.code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 0;
  return { succeeded, exitCode: result.code, stderr: result.stderr.slice(-2000) };
}

// veraPDF's --format json report shape (confirmed against a real run, not
// guessed): report.jobs[0].validationResult[0].compliant is the actual
// verdict; ruleSummaries lists every rule that was checked, each with a
// ruleStatus of "FAILED" or "PASSED".
function parseVeraPdfReport(stdout) {
  const parsed = JSON.parse(stdout);
  const job = parsed?.report?.jobs?.[0];
  const validation = job?.validationResult?.[0];
  if (!validation) throw new Error('veraPDF report had no validation result.');

  const failedRules = (validation.details?.ruleSummaries || [])
    .filter((r) => r.ruleStatus === 'FAILED')
    .map((r) => ({
      clause: r.clause,
      testNumber: r.testNumber,
      description: r.description,
      count: r.failedChecks,
    }));

  return {
    compliant: validation.compliant === true,
    profileName: validation.profileName,
    passedRules: validation.details?.passedRules ?? null,
    failedRules,
  };
}

async function validateWithVeraPdf(workDir, conformance, signal) {
  let result;
  try {
    result = await runProcess(VERAPDF_BIN, ['-f', conformance, '--format', 'json', OUTPUT_NAME], { cwd: workDir, signal });
  } catch (err) {
    return { compliant: false, error: `veraPDF could not be started: ${err.code || err.message}` };
  }
  try {
    return parseVeraPdfReport(result.stdout);
  } catch (err) {
    return { compliant: false, error: `Could not parse veraPDF output: ${err.message}`, raw: result.stdout.slice(-2000) };
  }
}

// Converts to PDF/A with Ghostscript, then validates the result with
// veraPDF. The file is only ever returned if veraPDF confirms compliance --
// a Ghostscript conversion that "succeeds" but doesn't actually pass
// validation is reported as a failure, not silently handed over.
async function convertToPdfA(workDir, conformance, signal) {
  const conversion = await convertWithGhostscript(workDir, conformance, signal);

  if (!conversion.succeeded) {
    return {
      ok: false,
      compliant: false,
      conformance,
      error: 'Ghostscript could not convert this file to PDF/A.',
      ghostscriptExitCode: conversion.exitCode,
    };
  }

  const verapdf = await validateWithVeraPdf(workDir, conformance, signal);

  if (!verapdf.compliant) {
    return {
      ok: false,
      compliant: false,
      conformance,
      error: `The converted file did not pass veraPDF validation against PDF/A-${conformance}.`,
      verapdf,
    };
  }

  return { ok: true, compliant: true, conformance, verapdf, outputPath: path.join(workDir, OUTPUT_NAME) };
}

module.exports = { convertToPdfA };
