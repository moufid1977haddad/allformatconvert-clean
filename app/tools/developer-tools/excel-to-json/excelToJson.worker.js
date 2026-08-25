import { MAX_ROWS } from './config';

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
  const workbook = XLSX.read(bytes, { type: 'array' });

  self.postMessage({ type: 'progress', pct: 85, phase: 'building' });
  const result = {};
  let totalRows = workbook.SheetNames.length; // one header row implied per sheet
  workbook.SheetNames.forEach((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    result[name] = rows;
    totalRows += rows.length;
  });
  if (totalRows > limit) throw new RowLimitExceededError(limit, totalRows);

  const json = JSON.stringify(result, null, 2);
  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });
  const blob = new Blob([json], { type: 'application/json' });
  self.postMessage({ type: 'done', blob, rowCount: totalRows });
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
