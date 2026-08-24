// Shared RFC 4180-style CSV parsing, used by every CSV/Excel-family tool.
//
// parseCsvRows() parses a complete string in one call — fine for pasted text
// or small inputs already fully in memory.
//
// IncrementalCsvParser is resumable across text chunks (e.g. from a streamed
// file read), so a large file can be parsed without first holding its entire
// contents as one string. It carries quote state across push() calls; a
// quote character at the very end of a chunk is deferred by exactly one
// character until the next chunk arrives, since a doubled "" (an escaped
// quote inside a quoted field) can straddle a chunk boundary.

export function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export class IncrementalCsvParser {
  constructor(onRow) {
    this.onRow = onRow;
    this.row = [];
    this.field = '';
    this.inQuotes = false;
    this.pending = '';
  }

  push(chunk) {
    const buf = this.pending + chunk;
    this.pending = '';
    const n = buf.length;
    if (n === 0) return;
    const limit = n - 1;
    let i = 0;
    while (i < limit) i = this._step(buf, i);
    if (i < n) {
      if (this.inQuotes && buf[i] === '"') {
        this.pending = buf[i];
      } else {
        this._step(buf, i);
      }
    }
  }

  _step(buf, i) {
    const c = buf[i];
    if (this.inQuotes) {
      if (c === '"') {
        if (buf[i + 1] === '"') { this.field += '"'; return i + 2; }
        this.inQuotes = false; return i + 1;
      }
      this.field += c; return i + 1;
    }
    if (c === '"') { this.inQuotes = true; return i + 1; }
    if (c === ',') { this.row.push(this.field); this.field = ''; return i + 1; }
    if (c === '\r') { return i + 1; }
    if (c === '\n') {
      this.row.push(this.field);
      this.onRow(this.row);
      this.row = [];
      this.field = '';
      return i + 1;
    }
    this.field += c; return i + 1;
  }

  finish() {
    if (this.pending) {
      // A lone trailing quote with no more data is a closing quote, not the
      // start of a doubled "" escape — matches parseCsvRows' behavior when
      // there's no next character to look ahead at.
      this.inQuotes = false;
      this.pending = '';
    }
    if (this.field !== '' || this.row.length > 0) {
      this.row.push(this.field);
      this.onRow(this.row);
    }
  }
}
