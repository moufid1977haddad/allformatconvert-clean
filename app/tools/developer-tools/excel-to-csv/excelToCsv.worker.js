import { MAX_ROWS } from './config';

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

async function run({ file, maxRows }) {
  const limit = maxRows || MAX_ROWS;
  const bytes = await readFileWithProgress(file);

  // XLSX.read has to ingest the whole zip/XML container in one pass -- there
  // is no incremental parse to report progress against, so this jumps
  // straight to a "parsing" phase marker instead of a smooth percentage.
  self.postMessage({ type: 'progress', pct: 50, phase: 'parsing' });
  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule.default || xlsxModule;
  const workbook = XLSX.read(bytes, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  // Sent as soon as the workbook structure is known -- well before the CSV
  // (or zip) is built -- so the UI can tell the visitor how many sheets were
  // found while the conversion is still in progress, not only after.
  self.postMessage({ type: 'sheets', sheetNames });

  self.postMessage({ type: 'progress', pct: 85, phase: 'building' });
  const csvBySheet = sheetNames.map((name) => XLSX.utils.sheet_to_csv(workbook.Sheets[name]));
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
