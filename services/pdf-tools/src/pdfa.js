const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const { GS_BIN, QPDF_BIN, VERAPDF_BIN, PDFPY_BIN, PDFTOTEXT_BIN } = require('./config');

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
// (accessible/tagged) structure (see the P26 levels below).
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

// ---- P26 (E2): levels 2u, 3u, 2a, 3a ---------------------------------------------------------------------
// U (Unicode): Ghostscript as for B (it writes ToUnicode maps where it can), the XMP relabelled U, then veraPDF
// against the U profile. A (accessible): needs a TAGGED source -- Ghostscript drops the structure tree, so the
// source itself is kept (py/pdfa_fix.py keep: OutputIntent, XMP, MarkInfo; page content untouched) and veraPDF
// checks it against the A profile. Measured on real files before being offered (docs/audit/RAPPORT-p26-railway-03-10.md).
// allowDowngrade (iLovePDF's allow_downgrade): when the level is not reached, the next lower one is tried
// (A -> U -> B of the same part) and the response says so; without it, nothing but the requested level is returned.
// 1b/2b/3b: attemptB (P27).
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

// Text of a PDF as TWO readers see it -- Ghostscript (txtwrite) and Poppler (pdftotext, the reader of most Linux
// viewers). Measured (P26): Ghostscript's PDF/A rewrite can lose text that the source maps correctly -- the "ti"
// ligature of LibreOffice PDFs came out as nothing ("section" -> "secon") while veraPDF still passed U, since it checks
// that a mapping EXISTS, not that it is right. Measured (P27): txtwrite ignores /ActualText (LibreOffice and Chromium
// wrap accents drawn as two glyphs, ligatures and Arabic in it: "données" reads "donne" + U+0008 + "es"), so a rewrite
// that dropped the ActualText would look unchanged to it; pdftotext reads ActualText.
async function readText(workDir, bin, args, out, signal) {
  const file = path.join(workDir, out);
  fs.rmSync(file, { force: true }); // never read a previous attempt's text
  let r;
  try {
    r = await runProcess(bin, args, { cwd: workDir, signal });
  } catch {
    return null;
  }
  if (r.code !== 0 || !fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
    return null;
  }
  return fs.readFileSync(file, 'utf8');
}

const readBoth = (workDir, name, signal) => Promise.all([
  readText(workDir, GS_BIN, ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=txtwrite', `-sOutputFile=${name}.gs.txt`, name], `${name}.gs.txt`, signal),
  readText(workDir, PDFTOTEXT_BIN, ['-enc', 'UTF-8', name, `${name}.pp.txt`], `${name}.pp.txt`, signal),
]);

const PLAIN = 'input-plain.pdf';
async function pdfText(workDir, name, signal) {
  // the source never changes within a request: read once (it can be compared to two candidates)
  const cache = path.join(workDir, `${name}.both.json`);
  if (name === INPUT_NAME && fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  let texts = await readBoth(workDir, name, signal);
  if (name === INPUT_NAME && texts.includes(null)) {
    // A source with an owner password (copy restriction) can be refused by a reader; the result never has one
    // (PDF/A forbids encryption). Its text is then read from a decrypted copy -- same content streams, same text.
    const r = await runProcess(QPDF_BIN, ['--decrypt', INPUT_NAME, PLAIN], { cwd: workDir, signal }).catch(() => null);
    if (r && (r.code === 0 || r.code === 3) && fs.existsSync(path.join(workDir, PLAIN))) texts = await readBoth(workDir, PLAIN, signal);
  }
  if (texts.includes(null)) return null;
  if (name === INPUT_NAME) fs.writeFileSync(cache, JSON.stringify(texts));
  return texts;
}

// Only ASCII whitespace is layout: a no-break space or an ideographic space is text, and is compared as such.
const LAYOUT_SPACE = /[ \t\n\r\f\v]+/g;
const letters = (t) => t.replace(LAYOUT_SPACE, '');
const folded = (t) => t.replace(LAYOUT_SPACE, ' ').trim();

// P27: a file is delivered only if its text is the source's text: the same characters in the same order for BOTH
// readers (layout spaces aside), and the same words for at least one of them -- where a reader puts a word space is
// decided from glyph positions, which a rewrite can move by a hair without changing any letter (independent review).
// null when a text cannot be read -- then nothing is delivered either.
async function textUnchanged(workDir, signal) {
  const [before, after] = await Promise.all([pdfText(workDir, INPUT_NAME, signal), pdfText(workDir, OUTPUT_NAME, signal)]);
  if (before === null || after === null) return null;
  const sameLetters = before.every((t, i) => letters(t) === letters(after[i]));
  const sameWords = before.some((t, i) => folded(t) === folded(after[i]));
  return sameLetters && sameWords;
}

const delivered = (level, method, verapdf, workDir) => ({ ok: true, compliant: true, conformance: level, method, verapdf, outputPath: path.join(workDir, OUTPUT_NAME) });

// The source kept as it is (pdfa_fix.py keep), validated, and -- one rule for every level -- text-checked.
// { result } when delivered; otherwise what was found, and the caller tries Ghostscript or says why.
async function attemptKept(workDir, level, conf, signal) {
  const kept = await fix(workDir, ['keep', INPUT_NAME, OUTPUT_NAME, level[0], conf], signal);
  if (!kept.ok) return { tried: false };
  const verapdf = await validateWithVeraPdf(workDir, level, signal);
  if (!verapdf.compliant) return { tried: true, verapdf };
  const same = await textUnchanged(workDir, signal);
  if (same !== true) return { tried: true, verapdf, reason: same === null ? 'text_unchecked' : 'text_changed' };
  return { result: delivered(level, 'kept', verapdf, workDir) };
}

// P27: 1b/2b/3b (asked for, or the lower level of a u/a request). Before P27 they were Ghostscript's output as it
// came, and measured in production (P26) that output changed the text of real files -- Greek "Ελληνικά" ->
// "Ε½½ην»¼ά", ligatures "section" -> "sec琀椀on", accents "données" -> "donnees" -- while the pages LOOKED right.
// Same method as the u levels: 1. the source itself, its pages untouched (only what PDF/A requires is added), when it
// already meets PDF/A-<part>b; 2. Ghostscript (fonts embedded, colours converted...), accepted only if veraPDF passes
// AND its text is the source's; 3. otherwise no file, and the reason.
async function attemptB(workDir, level, signal) {
  const info = await inspectPdf(workDir, signal);
  if (info && info.ok === false && info.encrypted) return { ok: false, reason: 'encrypted' };
  const kept = await attemptKept(workDir, level, 'B', signal);
  if (kept.result) return kept.result;
  // After a failed "u" attempt, its Ghostscript output (same arguments) is reused instead of running Ghostscript a
  // second time on the same input.
  const gsOut = path.join(workDir, GS_KEPT);
  if (!fs.existsSync(gsOut)) {
    const gs = await convertWithGhostscript(workDir, level, signal);
    if (!gs.succeeded) return { ok: false, reason: 'conversion_failed', ghostscriptExitCode: gs.exitCode };
    fs.renameSync(path.join(workDir, OUTPUT_NAME), gsOut);
  }
  fs.copyFileSync(gsOut, path.join(workDir, OUTPUT_NAME));
  const verapdf = await validateWithVeraPdf(workDir, level, signal);
  if (!verapdf.compliant) return { ok: false, reason: 'not_compliant', verapdf };
  const same = await textUnchanged(workDir, signal);
  if (same !== true) return { ok: false, reason: same === null ? 'text_unchecked' : 'text_changed' };
  return delivered(level, 'ghostscript', verapdf, workDir);
}

// Measured (P26): when a u or a level fails veraPDF, the usual cause is text the SOURCE PDF itself never maps to
// Unicode -- ligatures ("ti", "fi") and decomposed accents that LibreOffice prints as glyphs without text. Guessing
// those characters would be inventing content, so the level is not reached and the visitor is told why.
const unicodeReason = (verapdf) => ((verapdf.failedRules || []).length > 0 && verapdf.failedRules.every((r) => r.clause === '6.2.11.7.2') ? 'no_unicode' : 'not_compliant');

async function attemptLevel(workDir, level, signal) {
  const part = level[0];
  const kind = level[1];
  if (kind === 'b') return attemptB(workDir, level, signal);
  if (kind === 'u') {
    // 1. The source itself, its pages untouched: enough when it already meets PDF/A.
    const kept = await attemptKept(workDir, level, 'U', signal);
    if (kept.result) return kept.result;
    // 2. Ghostscript (fonts embedded, colours converted...), relabelled U, and accepted only if its text is the
    //    source's text.
    const gs = await convertWithGhostscript(workDir, level, signal);
    if (!gs.succeeded) return { ok: false, reason: 'conversion_failed' };
    fs.renameSync(path.join(workDir, OUTPUT_NAME), path.join(workDir, GS_KEPT));
    const relabel = await fix(workDir, ['set-id', GS_KEPT, OUTPUT_NAME, part, 'U'], signal);
    if (!relabel.ok) return { ok: false, reason: 'conversion_failed' };
    const verapdf = await validateWithVeraPdf(workDir, level, signal);
    if (!verapdf.compliant) return { ok: false, reason: unicodeReason(verapdf), verapdf };
    const same = await textUnchanged(workDir, signal);
    if (same !== true) return { ok: false, reason: same === null ? 'text_unchecked' : 'text_changed' };
    return delivered(level, 'ghostscript', verapdf, workDir);
  }
  // a: only the source itself, structure kept.
  const info = await inspectPdf(workDir, signal);
  if (!info || info.ok === false) return { ok: false, reason: info?.encrypted ? 'encrypted' : 'conversion_failed' };
  if (!info.tagged) return { ok: false, reason: 'untagged' };
  const kept = await attemptKept(workDir, level, 'A', signal);
  if (kept.result) return kept.result;
  if (!kept.tried) return { ok: false, reason: 'conversion_failed' };
  if (kept.reason) return { ok: false, reason: kept.reason };
  return { ok: false, reason: unicodeReason(kept.verapdf), verapdf: kept.verapdf };
}

const REASON_TEXT = {
  encrypted: 'the PDF is password-protected',
  untagged: 'the PDF is not tagged (no structure tree), which an "a" level requires',
  text_changed: 'making it conformant would have changed some of its text (letters such as ligatures, accents or non-Latin script would be altered)',
  text_unchecked: 'its text could not be read back to check that the conversion kept it unchanged',
  no_unicode: 'some characters in this PDF have no Unicode text behind them (often ligatures such as "fi" or "ti", or accents drawn separately), which a "u" or "a" level requires',
  not_compliant: 'the result did not pass veraPDF validation',
  conversion_failed: 'the file could not be converted',
};

async function convertToPdfALevel(workDir, requested, allowDowngrade, signal) {
  const part = requested[0];
  const chain = requested[1] === 'a' ? [`${part}a`, `${part}u`, `${part}b`] : requested[1] === 'u' ? [`${part}u`, `${part}b`] : [`${part}b`];
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
    ? ` The lower level${lower.length > 1 ? 's' : ''} could not be reached either (${attempts.slice(1).map((a) => `PDF/A-${a.conformance}: ${a.why}`).join('; ')}).`
    : '';
  // P27: when the text would have changed, say what to do instead -- the visitor's own application writes PDF/A
  // from the original document without this risk.
  const textAdvice = attempts.some((a) => a.reason === 'text_changed' || a.reason === 'text_unchecked')
    ? ' No file was returned, rather than one whose search and copy-paste would give wrong text. To archive this document, export it as PDF/A from its original (Word: Save As › PDF › Options › “PDF/A compliant”; LibreOffice: Export as PDF › “Archive (PDF/A, ISO 19005)”).'
    : '';
  let error;
  if (first?.reason === 'untagged') {
    error = `PDF/A-${requested} needs a tagged PDF, and this one has no tags. Export it again with tags (Word: "Document structure tags for accessibility"; LibreOffice: "Universal accessibility (PDF/UA)")${lower.length ? '.' : `, or choose PDF/A-${part}u.`}`;
  } else if (first?.reason === 'encrypted') {
    error = 'This PDF is password-protected. Remove the password first (Unlock PDF), then convert it.';
  } else if (first?.reason === 'text_changed' || first?.reason === 'text_unchecked') {
    error = `PDF/A-${requested} can't be made from this file without risk to its text: ${REASON_TEXT[first.reason]}.`;
  } else if (first?.reason === 'no_unicode') {
    error = `PDF/A-${requested} can't be reached: ${REASON_TEXT.no_unicode}.${lower.length ? '' : ` PDF/A-${part}b has no such requirement.`}`;
  } else if (first?.reason === 'conversion_failed') {
    error = `This file could not be converted to PDF/A-${requested} (it may be damaged — PDF Repair can often fix that).`;
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
    error: error + tail + textAdvice,
    // veraPDF's report only when it is the reason (a text refusal with a passing report would read "not compliant")
    verapdf: last?.reason === 'not_compliant' || last?.reason === 'no_unicode' ? last.verapdf : undefined,
  };
}

module.exports = { convertToPdfALevel, ADVANCED_LEVELS };
