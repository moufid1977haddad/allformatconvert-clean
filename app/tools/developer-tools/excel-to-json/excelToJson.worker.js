import { fixSupplementaryCharRefs } from '../../../lib/xlsxSupplementaryChars';
import { MAX_ROWS } from './config';
import { datesToText, workbookIs1904 } from '../../../lib/sheetDates';

class RowLimitExceededError extends Error {
  constructor(limit, actual) {
    super(`This workbook has ${actual.toLocaleString()} rows across all sheets, more than the ${limit.toLocaleString()}-row limit, counting each sheet's header row.`);
    this.name = 'RowLimitExceededError';
    this.limit = limit;
  }
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

async function run({ file, maxRows }) {
  const limit = maxRows || MAX_ROWS;
  const bytes = await readFileWithProgress(file);

  self.postMessage({ type: 'progress', pct: 50, phase: 'parsing' });
  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule.default || xlsxModule;
  // cellNF keeps each cell's number format, so date cells can be recognised.
  // P24 review (03/10): a .csv given here was typed by SheetJS ("007" → 7, a 20-digit id rounded, 01/02/2024 read as
  // a US date): a text file is read as text (raw), as CSV to JSON does; a real workbook keeps its own cell types.
  const isWorkbook = (bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf) || /^\s*<\?xml|^\s*<(table|html|Workbook)/i.test(new TextDecoder().decode(bytes.subarray(0, 64)));
  const workbook = XLSX.read(fixSupplementaryCharRefs(bytes).bytes, isWorkbook ? { type: 'array', cellNF: true } : { type: 'array', raw: true, cellDates: false });

  const sheetNames = workbook.SheetNames;
  // Sent as soon as the workbook structure is known -- well before the JSON
  // is built -- so the UI can tell the visitor how many sheets were found
  // (and their real names) while the conversion is still in progress. Every
  // sheet has always been included in the output below (keyed by its real
  // name) -- this message only makes that fact visible instead of implicit.
  self.postMessage({ type: 'sheets', sheetNames });

  self.postMessage({ type: 'progress', pct: 85, phase: 'building' });
  const result = {};
  let totalRows = sheetNames.length; // one header row implied per sheet
  sheetNames.forEach((name) => {
    datesToText(workbook.Sheets[name], XLSX, workbookIs1904(workbook));
    // defval: a cell left empty still gets its key (null), so every row of a
    // sheet has the same properties -- they used to be silently omitted.
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: null });
    result[name] = rows;
    totalRows += rows.length;
  });
  if (totalRows > limit) throw new RowLimitExceededError(limit, totalRows);

  const json = JSON.stringify(result, null, 2);
  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });
  const blob = new Blob([json], { type: 'application/json' });
  self.postMessage({ type: 'done', blob, rowCount: totalRows, sheetNames });
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
