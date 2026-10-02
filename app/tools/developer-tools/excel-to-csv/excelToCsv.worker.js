import { MAX_ROWS } from './config';
import { fixSupplementaryCharRefs } from '../../../lib/xlsxSupplementaryChars';
import { datesToText, generalNumbersInFull, workbookIs1904 } from '../../../lib/sheetDates';

class RowLimitExceededError extends Error {
  constructor(limit, actual) {
    super(`This workbook has ${actual.toLocaleString()} rows across all sheets, more than the ${limit.toLocaleString()}-row limit, counting each sheet's header row.`);
    this.name = 'RowLimitExceededError';
    this.limit = limit;
  }
}

// Sheet names can contain characters that are illegal (or awkward) in a
// filename on common filesystems -- strip/replace those before using a
// sheet's real name as a zip-entry filename, and de-dupe in case two sheets
// sanitize down to the same name.
function sanitizeSheetFileName(name, index) {
  const cleaned = String(name || '').trim().replace(/[\\/:*?"<>|]/g, '_');
  return cleaned || `Sheet${index + 1}`;
}

function dedupeFileNames(names) {
  const used = new Set();
  return names.map((name) => {
    let candidate = `${name}.csv`;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${name} (${n}).csv`;
      n++;
    }
    used.add(candidate);
    return candidate;
  });
}

async function readFileWithProgress(file) {
  const total = file.size || 0;
  let read = 0;
  let lastReportedPct = -1;
  const chunks = [];
  const reader = file.stream().getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    read += value.length;
    if (total > 0) {
      const pct = Math.min(40, Math.floor((read / total) * 40));
      if (pct !== lastReportedPct) {
        lastReportedPct = pct;
        self.postMessage({ type: 'progress', pct, phase: 'reading' });
      }
    }
  }
  const merged = new Uint8Array(read);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

// P24 review (03/10): with the semicolon separator, a European Excel reads "3.14" as text or a date — numbers can be
// written with a decimal comma (and a point between thousands when the cell's format has one): "1,234.56" → "1.234,56".
// Only number cells; dates are already text here (datesToText), and text cells are left as typed.
// P24 review (03/10): only text the format itself produced is rewritten — an ODS cell carries no format code and its
// text is already in the file's language ("3,14", "1 234,50 €"): swapping it gave "3.14". Points and commas written as
// literals in the format ("kg.", a CPF mask 000"."000"."000"-"00) are kept: they stand in for private-use characters
// while the number's own separators are swapped.
const LIT_POINT = '\uE000', LIT_COMMA = '\uE001';
function protectLiterals(fmt) {
  let out = '', quoted = false;
  for (let i = 0; i < fmt.length; i++) {
    const ch = fmt[i];
    if (ch === '"') { quoted = !quoted; out += ch; continue; }
    if (!quoted && ch === '\\' && i + 1 < fmt.length) { const n = fmt[++i]; out += '\\' + (n === '.' ? LIT_POINT : n === ',' ? LIT_COMMA : n); continue; }
    out += quoted && ch === '.' ? LIT_POINT : quoted && ch === ',' ? LIT_COMMA : ch;
  }
  return out;
}
function decimalCommas(ws, XLSX) {
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const c = ws[addr];
    if (c.t !== 'n' || !Number.isFinite(c.v)) continue;
    const fmt = c.z || 'General';
    let w;
    if (fmt === 'General' && c.w === String(Number(c.v.toPrecision(15)))) w = c.w; // written in full by generalNumbersInFull
    else if (c.w !== undefined && /^-?\d+(\.\d+)?(E[+-]?\d+)?$/i.test(c.w) && Number(c.w) === c.v) w = c.w; // a plain point-decimal number
    else if (c.w !== undefined && c.w !== XLSX.SSF.format(fmt, c.v)) continue; // localised text (ODS): kept as written
    else { try { w = XLSX.SSF.format(protectLiterals(String(fmt)), c.v); } catch { continue; } }
    c.w = String(w).replace(/[.,]/g, (ch) => (ch === '.' ? ',' : '.')).split(LIT_POINT).join('.').split(LIT_COMMA).join(',');
  }
}
async function run({ file, maxRows, delimiter = ',', bom = false, decimalComma = false }) {
  const limit = maxRows || MAX_ROWS;
  const bytes = await readFileWithProgress(file);

  // XLSX.read has to ingest the whole zip/XML container in one pass -- there
  // is no incremental parse to report progress against, so this jumps
  // straight to a "parsing" phase marker instead of a smooth percentage.
  self.postMessage({ type: 'progress', pct: 50, phase: 'parsing' });
  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule.default || xlsxModule;
  // Emoji written as &#128512; (openpyxl, pandas) would otherwise come out as
  // U+F600 -- see app/lib/xlsxSupplementaryChars.js (29/09).
  // cellNF keeps each cell's number format: dates become ISO dates and "General" numbers keep every digit (P24)
  const workbook = XLSX.read(fixSupplementaryCharRefs(bytes).bytes, { type: 'array', cellNF: true });

  const sheetNames = workbook.SheetNames;
  // Sent as soon as the workbook structure is known -- well before the CSV
  // (or zip) is built -- so the UI can tell the visitor how many sheets were
  // found while the conversion is still in progress, not only after.
  self.postMessage({ type: 'sheets', sheetNames });

  self.postMessage({ type: 'progress', pct: 85, phase: 'building' });
  const date1904 = workbookIs1904(workbook);
  const csvBySheet = sheetNames.map((name) => { const ws = workbook.Sheets[name]; datesToText(ws, XLSX, date1904); generalNumbersInFull(ws, XLSX); if (decimalComma) decimalCommas(ws, XLSX); return (bom ? '\uFEFF' : '') + XLSX.utils.sheet_to_csv(ws, { FS: delimiter === 'tab' ? '\t' : delimiter }); });
  // P24 (03/10): separator (comma, semicolon for European Excel, tab) and a UTF-8 BOM so Excel reopens accents right
  const rowCounts = csvBySheet.map((csv) => csv.split('\n').filter(Boolean).length);
  const totalRows = rowCounts.reduce((a, b) => a + b, 0);
  if (totalRows > limit) throw new RowLimitExceededError(limit, totalRows);

  if (sheetNames.length === 1) {
    // Single-sheet workbook: unchanged behavior -- a plain .csv, no zip.
    self.postMessage({ type: 'progress', pct: 97, phase: 'building' });
    const blob = new Blob([csvBySheet[0]], { type: 'text/csv' });
    self.postMessage({ type: 'done', blob, rowCount: rowCounts[0], sheetNames, isZip: false });
    return;
  }

  // Multi-sheet workbook: every sheet used to be silently dropped except the
  // first. Now each sheet becomes its own .csv, named after the real sheet
  // name, packed into one .zip so nothing is lost.
  self.postMessage({ type: 'progress', pct: 90, phase: 'zipping' });
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const fileNames = dedupeFileNames(sheetNames.map((name, i) => sanitizeSheetFileName(name, i)));
  fileNames.forEach((fileName, i) => zip.file(fileName, csvBySheet[i]));

  const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    self.postMessage({ type: 'progress', pct: 90 + Math.round(metadata.percent * 0.07), phase: 'zipping' });
  });
  self.postMessage({ type: 'done', blob, rowCount: totalRows, sheetNames, isZip: true });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    if (err instanceof RowLimitExceededError) {
      self.postMessage({ type: 'row_limit', limit: err.limit });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
