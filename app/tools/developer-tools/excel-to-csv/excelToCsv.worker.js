import { MAX_ROWS } from './config';

class RowLimitExceededError extends Error {
  constructor(limit, actual) {
    super(`This workbook's first sheet has ${actual.toLocaleString()} rows, more than the ${limit.toLocaleString()}-row limit, counting the header row.`);
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

  // XLSX.read has to ingest the whole zip/XML container in one pass -- there
  // is no incremental parse to report progress against, so this jumps
  // straight to a "parsing" phase marker instead of a smooth percentage.
  self.postMessage({ type: 'progress', pct: 50, phase: 'parsing' });
  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule.default || xlsxModule;
  const workbook = XLSX.read(bytes, { type: 'array' });

  self.postMessage({ type: 'progress', pct: 85, phase: 'building' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const rowCount = csv.split('\n').filter(Boolean).length;
  if (rowCount > limit) throw new RowLimitExceededError(limit, rowCount);

  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });
  const blob = new Blob([csv], { type: 'text/csv' });
  self.postMessage({ type: 'done', blob, rowCount });
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
