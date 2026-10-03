const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const { QPDF_BIN, GS_BIN, PDFTOTEXT_BIN, PDFUNITE_BIN, PDFPY_BIN } = require('./config');

const INPUT_NAME = 'input.pdf';
const QPDF_OUT_NAME = 'qpdf-out.pdf';
const POPPLER_OUT_NAME = 'poppler-out.pdf';
const REBUILT_IN_NAME = 'rebuilt-in.pdf';
const REBUILT_OUT_NAME = 'rebuilt-out.pdf';
const GS_OUT_NAME = 'gs-out.pdf';
const REBUILD_SCRIPT = path.join(__dirname, '..', 'py', 'rebuild_pages.py');

// Every child process below runs with cwd set to the request's own temp dir
// and is given only relative filenames -- qpdf and Ghostscript both embed
// the path they were given into their own warning/error text, and that text
// is returned to the caller as the repair report. Relative names keep that
// report from leaking the server's absolute temp-directory layout.

// qpdf's own exit codes: 0 = success, no warnings. 3 = succeeded, but with
// warnings (this is the normal outcome for a file with a damaged xref table
// -- qpdf's default behavior, with no special flag needed, is to attempt
// reconstruction rather than fail). 2 = qpdf could not produce output at all.
async function tryQpdfRepair(workDir, signal, input = INPUT_NAME, output = QPDF_OUT_NAME) {
  let result;
  try {
    result = await runProcess(QPDF_BIN, [input, output], { cwd: workDir, signal });
  } catch (err) {
    return { succeeded: false, warnings: [], exitCode: null, spawnError: err.code || err.message };
  }
  const warnings = result.stderr
    .split(/\r?\n/)
    .filter((l) => l.startsWith('WARNING:'))
    .slice(0, 20);
  const succeeded = (result.code === 0 || result.code === 3) && fs.existsSync(path.join(workDir, output));
  return { succeeded, warnings, exitCode: result.code };
}

// P28: Poppler's own reconstruction, written out by pdfunite -- it copies every page object it can reach, content
// streams untouched. Measured on a file with 2 KB wiped in the middle: qpdf's reconstruction lost an object (a whole
// sentence missing from its output) that Poppler and Ghostscript still read in the damaged file; pdfunite's output
// had exactly the text both read. Not kept: bookmarks, tagged structure, document metadata (pdfunite copies pages).
async function tryPopplerRepair(workDir, signal) {
  let result;
  try {
    result = await runProcess(PDFUNITE_BIN, [INPUT_NAME, POPPLER_OUT_NAME], { cwd: workDir, signal });
  } catch {
    return { succeeded: false };
  }
  const outPath = path.join(workDir, POPPLER_OUT_NAME);
  return { succeeded: result.code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 0 };
}

// P28: a PDF that lost its end (trailer, catalog, cross-reference stream) -- qpdf, Poppler and Ghostscript all
// refuse it. py/rebuild_pages.py appends a new catalog over the page tree still in the file (or, when none survives,
// over its self-contained pages in object order), and qpdf rebuilds the cross-reference table. See the script for
// the rules that keep an older revision or a deleted page from coming back (independent review, P28).
async function tryRebuild(workDir, signal) {
  let r;
  try {
    r = await runProcess(PDFPY_BIN, [REBUILD_SCRIPT, INPUT_NAME, REBUILT_IN_NAME], { cwd: workDir, signal });
  } catch {
    return { succeeded: false };
  }
  if (r.code !== 0) return { succeeded: false };
  let mode = null;
  try { mode = JSON.parse(r.stdout.trim()).mode; } catch { return { succeeded: false }; }
  const q = await tryQpdfRepair(workDir, signal, REBUILT_IN_NAME, REBUILT_OUT_NAME);
  return { succeeded: q.succeeded, mode };
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

// ---- P28: the text check (same two readers and the same rule as the PDF/A check of P27, src/pdfa.js) ----------------
// A repaired file is delivered only if its text is the text the damaged file still shows in Ghostscript (txtwrite)
// and Poppler (pdftotext, which reads /ActualText): readers repair what they open, so "the source's readable text" is
// what each of them reads in it. A reader that cannot open the damaged file at all is left out; if neither can, the
// text cannot be compared, and only a structural repair (content streams copied, never reinterpreted) is delivered,
// saying so.
async function readText(workDir, bin, args, out, signal) {
  const file = path.join(workDir, out);
  fs.rmSync(file, { force: true });
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
  const text = fs.readFileSync(file, 'utf8');
  fs.rmSync(file, { force: true });
  return text;
}

const readBoth = (workDir, name, signal) => Promise.all([
  readText(workDir, GS_BIN, ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=txtwrite', `-sOutputFile=${name}.gs.txt`, name], `${name}.gs.txt`, signal),
  readText(workDir, PDFTOTEXT_BIN, ['-enc', 'UTF-8', name, `${name}.pp.txt`], `${name}.pp.txt`, signal),
]);

// Only ASCII whitespace is layout: a no-break space or an ideographic space is text, and is compared as such.
const LAYOUT_SPACE = /[ \t\n\r\f\v]+/g;
const letters = (t) => t.replace(LAYOUT_SPACE, '');
const folded = (t) => t.replace(LAYOUT_SPACE, ' ').trim();

const READERS = ['Ghostscript', 'Poppler'];
// pdftotext ends every page with a form feed: the page count it read. Letters alone would call a lost page of a scan
// without text "the same" (independent review, P28).
const pagesRead = (t) => (t.match(/\f/g) || []).length;

// 'same' | 'differs' | 'unverifiable' (no reader opens the source) | 'unreadable' (a reader that opens the source
// cannot open the result). A reader that cannot open the source is left out: a content stream damaged in the file
// stays damaged in a structural repair, and such a reader refuses both alike.
function compareTexts(source, result) {
  const readable = source.map((t, i) => (t === null ? null : i)).filter((i) => i !== null);
  if (readable.length === 0) return result.every((t) => t === null) ? 'unreadable' : 'unverifiable';
  if (readable.some((i) => result[i] === null)) return 'unreadable';
  const sameLetters = readable.every((i) => letters(source[i]) === letters(result[i]));
  const sameWords = readable.some((i) => folded(source[i]) === folded(result[i]));
  const samePages = source[1] === null || pagesRead(source[1]) === pagesRead(result[1]);
  return sameLetters && sameWords && samePages ? 'same' : 'differs';
}

const METHOD_NOTES = {
  qpdf: [],
  poppler: [
    'Rebuilt by Poppler, which copied every page it could read: text, images and links kept; bookmarks, accessibility tags and document properties were not carried over.',
  ],
  'rebuilt:tree': [
    "The end of this file was missing (no catalog): a new one was added over the document's own page list, so page order and page settings are the document's. Bookmarks and document properties could not be recovered.",
  ],
  'rebuilt:object-order': [
    'The end of this file was missing, with its page list: the pages still in the file were put in the order they are stored, which is usually but not always the reading order. Check the pages: their order, and that none of them had been deleted from the document before. Bookmarks and document properties could not be recovered.',
  ],
  ghostscript: [
    'The structural repairs did not give a usable file; Ghostscript rewrote it from its content streams instead.',
    'This is a lossier repair: fonts and images were re-embedded rather than copied as-is.',
  ],
};
const STRUCTURAL = new Set(['qpdf', 'poppler', 'rebuilt']);

// Repairs a PDF, structural methods first (qpdf, Poppler, page-tree rebuild: content streams copied as they are),
// Ghostscript's full rewrite last. P28: every candidate must open cleanly AND carry the text the damaged file still
// shows; the first one that does is delivered. Returns a structured, honest report of what was actually done --
// never a blanket "fixed!" claim, and never a file whose text silently changed.
async function repairPdf(workDir, signal) {
  // Read while qpdf repairs (separate processes): on a 10 400-page file the text reads are what takes time (local
  // measure: Ghostscript 38 s, Poppler 13 s, qpdf 1 s).
  const sourceRead = readBoth(workDir, INPUT_NAME, signal);
  let source = null;
  const tried = [];
  let qpdfWarnings = [];
  let qpdfExitCode = null;
  let ghostscriptExitCode = null;
  let rebuildMode = null;
  const attempts = [
    ['qpdf', QPDF_OUT_NAME, async () => {
      const a = await tryQpdfRepair(workDir, signal);
      qpdfWarnings = a.warnings;
      qpdfExitCode = a.exitCode;
      return a.succeeded;
    }],
    ['poppler', POPPLER_OUT_NAME, async () => (await tryPopplerRepair(workDir, signal)).succeeded],
    ['rebuilt', REBUILT_OUT_NAME, async () => {
      const a = await tryRebuild(workDir, signal);
      rebuildMode = a.mode;
      return a.succeeded;
    }],
    ['ghostscript', GS_OUT_NAME, async () => {
      const a = await tryGhostscriptRepair(workDir, signal);
      ghostscriptExitCode = a.exitCode;
      return a.succeeded;
    }],
  ];
  for (const [method, name, attempt] of attempts) {
    if (signal.aborted) break;
    if (!(await attempt())) continue;
    // As before P28, only Ghostscript's rewrite must also pass qpdf --check: a structural repair of a file whose
    // content stream was itself damaged keeps that stream as it is (qpdf --check then reports it) -- the text check
    // below is what decides for those.
    if (method === 'ghostscript' && !(await verifyOpens(workDir, name, signal))) continue;
    const [src, result] = await Promise.all([source || sourceRead, readBoth(workDir, name, signal)]);
    source = src;
    const check = compareTexts(source, result);
    tried.push(`${method}:${check}`);
    if (check === 'same' || (check === 'unverifiable' && STRUCTURAL.has(method))) {
      const notes = [...METHOD_NOTES[method === 'rebuilt' ? `rebuilt:${rebuildMode}` : method]];
      if (tried.includes('qpdf:differs')) {
        notes.unshift("qpdf's structural repair changed the text this file still shows in PDF readers, so it was not used.");
      } else if (tried.includes('qpdf:unreadable')) {
        notes.unshift("qpdf's structural repair could not be read back by PDF readers, so it was not used.");
      }
      return {
        ok: true,
        method,
        textCheck: check,
        // the readers whose reading of the damaged file the result was compared with (none when unverifiable)
        checkedWith: source.map((t, i) => (t === null ? null : READERS[i])).filter(Boolean),
        warnings: [...notes, ...(method === 'qpdf' ? qpdfWarnings : [])].slice(0, 22),
        pageCount: await getPageCount(workDir, name, signal),
        outputPath: path.join(workDir, name),
        tried,
      };
    }
  }

  await sourceRead; // never leave a reader running on a temp dir about to be deleted
  if (tried.some((t) => t.endsWith(':differs'))) {
    // Something was rebuilt, but every result changed the text (or could not be read back): nothing is delivered.
    return {
      ok: false,
      error: 'This file could be rebuilt, but not without changing its text: every repaired version reads differently from what PDF readers still show in your file, so none was delivered. Opening it in another PDF reader and printing it to PDF keeps what that reader shows.',
      textCheck: 'differs',
      tried,
      qpdfExitCode,
      ghostscriptExitCode,
    };
  }
  return {
    ok: false,
    error: 'This file is too damaged to recover. qpdf and Poppler (structural repair), a rebuilt page list and Ghostscript (content-stream rewrite) all failed to produce a valid PDF.',
    qpdfExitCode,
    ghostscriptExitCode,
  };
}

module.exports = { repairPdf, compareTexts };
