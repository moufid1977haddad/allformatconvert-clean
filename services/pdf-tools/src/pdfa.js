const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const { GS_BIN, VERAPDF_BIN, PDFPY_BIN } = require('./config');

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
    // Ghostscript's default -dSAFER sandbox blocks the raw PostScript file
    // read that PDFA_def.ps does to load the ICC profile ("ICCProfile (r)
    // file"). Without this, that read silently fails, PDFA_def.ps skips
    // embedding the OutputIntent entirely, and the output has no
    // PDF/A OutputIntent at all -- on every conformance level, not just
    // 2b/3b. This grants read access to exactly that one file, keeping
    // SAFER's protection against the untrusted input PDF intact.
    `--permit-file-read=${ICC_NAME}`,
    // Explicit device colour space, not "let Ghostscript decide" via
    // UseDeviceIndependentColor: pdfwrite refuses to honor
    // UseDeviceIndependentColor for -dPDFA=2/3 ("cannot guarantee creating
    // a conformant PDF/A-2 file with device-independent colour") and
    // silently reverts to plain (non-PDF/A) pdfwrite output instead of
    // erroring, which is why 2b/3b were producing non-conformant files.
    // RGB is honored identically across 1b/2b/3b.
    '-sColorConversionStrategy=RGB',
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

// ---- P26 (E2): levels 2u, 3u, 2a, 3a ---------------------------------------------------------------------
// U (Unicode): Ghostscript as for B (it writes ToUnicode maps where it can), the XMP relabelled U, then veraPDF
// against the U profile. A (accessible): needs a TAGGED source -- Ghostscript drops the structure tree, so the
// source itself is kept (py/pdfa_fix.py keep: OutputIntent, XMP, MarkInfo; page content untouched) and veraPDF
// checks it against the A profile. Measured on real files before being offered (docs/audit/RAPPORT-p26-railway-03-10.md).
// allowDowngrade (iLovePDF's allow_downgrade): when the level is not reached, the next lower one is tried
// (A -> U -> B of the same part) and the response says so; without it, nothing but the requested level is returned.
// 1b/2b/3b keep the exact code path above (convertToPdfA).
const FIX_SCRIPT = path.join(__dirname, '..', 'py', 'pdfa_fix.py');
const ADVANCED_LEVELS = ['2u', '3u', '2a', '3a'];

async function fix(workDir, args, signal) {
  const r = await runProcess(PDFPY_BIN, [FIX_SCRIPT, ...args], { cwd: workDir, signal });
  let out = null;
  try { out = JSON.parse(r.stdout.trim().split(/\r?\n/).pop()); } catch { /* reported below */ }
  return { ok: r.code === 0 && out && out.ok !== false, out, stderr: r.stderr.slice(-500) };
}

async function inspectPdf(workDir, signal) {
  const r = await fix(workDir, ['inspect', INPUT_NAME], signal).catch(() => null);
  return r && r.out ? r.out : null;
}

const GS_KEPT = 'gs.pdf'; // Ghostscript's output of a "u" attempt: exactly what the "b" path of the same part makes

// Text of a PDF as Ghostscript reads it (txtwrite device), whitespace folded. Measured (P26): Ghostscript's PDF/A
// rewrite can lose text that the source maps correctly -- the "ti" ligature of LibreOffice PDFs came out as nothing
// ("section" -> "secon") while veraPDF still passed U, since it checks that a mapping EXISTS, not that it is right.
async function pdfText(workDir, name, signal) {
  const out = `${name}.txt`;
  const r = await runProcess(GS_BIN, ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=txtwrite', `-sOutputFile=${out}`, name], { cwd: workDir, signal });
  const file = path.join(workDir, out);
  if (r.code !== 0 || !fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').replace(/\s+/g, ' ').trim();
}

async function attemptLevel(workDir, level, signal) {
  const part = level[0];
  const kind = level[1];
  if (kind === 'b') {
    // After a failed "u" attempt, its Ghostscript output (same arguments as convertToPdfA) is validated as B
    // instead of running Ghostscript a second time on the same input.
    const kept = path.join(workDir, GS_KEPT);
    if (fs.existsSync(kept)) {
      fs.copyFileSync(kept, path.join(workDir, OUTPUT_NAME));
      const verapdf = await validateWithVeraPdf(workDir, level, signal);
      if (!verapdf.compliant) return { ok: false, reason: 'not_compliant', verapdf };
      return { ok: true, compliant: true, conformance: level, verapdf, outputPath: path.join(workDir, OUTPUT_NAME) };
    }
    const r = await convertToPdfA(workDir, level, signal);
    return r.ok ? r : { ok: false, reason: r.verapdf ? 'not_compliant' : 'conversion_failed', verapdf: r.verapdf };
  }
  if (kind === 'u') {
    // 1. The source itself, untouched (text exactly the source's): enough when it already meets PDF/A.
    const kept = await fix(workDir, ['keep', INPUT_NAME, OUTPUT_NAME, part, 'U'], signal);
    if (kept.ok) {
      const verapdf = await validateWithVeraPdf(workDir, level, signal);
      if (verapdf.compliant) return { ok: true, compliant: true, conformance: level, verapdf, outputPath: path.join(workDir, OUTPUT_NAME) };
    }
    // 2. Ghostscript (fonts embedded, colours converted...), relabelled U, and accepted only if its text is the
    //    source's text, word for word.
    const gs = await convertWithGhostscript(workDir, level, signal);
    if (!gs.succeeded) return { ok: false, reason: 'conversion_failed' };
    fs.renameSync(path.join(workDir, OUTPUT_NAME), path.join(workDir, GS_KEPT));
    const relabel = await fix(workDir, ['set-id', GS_KEPT, OUTPUT_NAME, part, 'U'], signal);
    if (!relabel.ok) return { ok: false, reason: 'conversion_failed' };
    const verapdf = await validateWithVeraPdf(workDir, level, signal);
    if (!verapdf.compliant) {
      const onlyUnicode = (verapdf.failedRules || []).length > 0 && verapdf.failedRules.every((r) => r.clause === '6.2.11.7.2');
      return { ok: false, reason: onlyUnicode ? 'no_unicode' : 'not_compliant', verapdf };
    }
    const [before, after] = await Promise.all([pdfText(workDir, INPUT_NAME, signal), pdfText(workDir, OUTPUT_NAME, signal)]);
    if (before === null || after === null || before !== after) return { ok: false, reason: 'text_changed', verapdf };
    return { ok: true, compliant: true, conformance: level, verapdf, outputPath: path.join(workDir, OUTPUT_NAME) };
  } else {
    const info = await inspectPdf(workDir, signal);
    if (!info || info.ok === false) return { ok: false, reason: info?.encrypted ? 'encrypted' : 'conversion_failed' };
    if (!info.tagged) return { ok: false, reason: 'untagged' };
    const kept = await fix(workDir, ['keep', INPUT_NAME, OUTPUT_NAME, part, 'A'], signal);
    if (!kept.ok) return { ok: false, reason: 'conversion_failed' };
  }
  const verapdf = await validateWithVeraPdf(workDir, level, signal);
  if (!verapdf.compliant) {
    // Measured (P26): the usual cause is text the SOURCE PDF itself never maps to Unicode -- ligatures ("ti",
    // "fi") and decomposed accents that LibreOffice prints as glyphs without text. Guessing those characters would
    // be inventing content, so the level is not reached and the visitor is told why.
    const onlyUnicode = (verapdf.failedRules || []).length > 0 && verapdf.failedRules.every((r) => r.clause === '6.2.11.7.2');
    return { ok: false, reason: onlyUnicode ? 'no_unicode' : 'not_compliant', verapdf };
  }
  return { ok: true, compliant: true, conformance: level, verapdf, outputPath: path.join(workDir, OUTPUT_NAME) };
}

const REASON_TEXT = {
  encrypted: 'the PDF is password-protected',
  untagged: 'the PDF is not tagged (no structure tree), which an "a" level requires',
  text_changed: 'making it conformant would have changed some of its text (letters such as ligatures or accents would be lost), so it was not delivered as a "u" level',
  no_unicode: 'some characters in this PDF have no Unicode text behind them (often ligatures such as "fi" or "ti", or accents drawn separately), which a "u" or "a" level requires',
  not_compliant: 'the result did not pass veraPDF validation',
  conversion_failed: 'the file could not be converted',
};

async function convertToPdfALevel(workDir, requested, allowDowngrade, signal) {
  const part = requested[0];
  const chain = requested[1] === 'a' ? [`${part}a`, `${part}u`, `${part}b`] : [`${part}u`, `${part}b`];
  const attempts = [];
  let last = null;
  for (const level of allowDowngrade ? chain : chain.slice(0, 1)) {
    if (signal?.aborted) break;
    const r = await attemptLevel(workDir, level, signal);
    if (r.ok) {
      return { ...r, requested, downgraded: level !== requested, attempts };
    }
    if (!last) last = r; // the REQUESTED level's report is the one shown with "not compliant with PDF/A-<requested>"
    attempts.push({ conformance: level, reason: r.reason, why: REASON_TEXT[r.reason] });
  }
  const first = attempts[0];
  const lower = attempts.slice(1).map((a) => a.conformance);
  const tail = lower.length
    ? ` The lower level${lower.length > 1 ? 's' : ''} (${lower.map((l) => `PDF/A-${l}`).join(', ')}) could not be reached either.`
    : '';
  let error;
  if (first?.reason === 'untagged') {
    error = `PDF/A-${requested} needs a tagged PDF, and this one has no tags. Export it again with tags (Word: "Document structure tags for accessibility"; LibreOffice: "Universal accessibility (PDF/UA)")${lower.length ? '.' : `, or choose PDF/A-${part}u.`}`;
  } else if (first?.reason === 'encrypted') {
    error = 'This PDF is password-protected. Remove the password first (Unlock PDF), then convert it.';
  } else if (first?.reason === 'text_changed') {
    error = `PDF/A-${requested} can't be reached for this file: ${REASON_TEXT.text_changed}.`;
  } else if (first?.reason === 'no_unicode') {
    error = `PDF/A-${requested} can't be reached: ${REASON_TEXT.no_unicode}.${lower.length ? '' : ` PDF/A-${part}b has no such requirement.`}`;
  } else {
    error = `The converted file did not pass veraPDF validation against PDF/A-${requested}.`;
  }
  return {
    ok: false,
    compliant: false,
    conformance: requested,
    requested,
    attempts,
    untagged: first?.reason === 'untagged',
    error: error + tail,
    verapdf: last?.verapdf,
  };
}

module.exports = { convertToPdfA, convertToPdfALevel, ADVANCED_LEVELS };
