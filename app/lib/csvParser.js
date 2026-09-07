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
//
// Both take an optional `delimiter` (default ','). detectDelimiter() picks
// one automatically from a text sample — see its own comment for the method.

export const CSV_DELIMITERS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
];

// Counts occurrences of `delim` in `line` that are outside a quoted span.
// Toggling `inQuotes` on every '"' (rather than fully parsing escapes) is
// sufficient here: a doubled "" inside a quoted field toggles twice in a
// row, which cancels out and leaves the quote state unchanged — the same
// net effect as properly consuming the escape.
function countUnquoted(line, delim) {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (!inQuotes && c === delim) count++;
  }
  return count;
}

// Splits a sample into logical rows the same way parseCsvRows() would --
// only a '\n'/'\r\n' outside a quoted span ends a row. A plain
// sample.split(/\r\n|\r|\n/) would instead cut a quoted field's own
// embedded newline (routine in real exports: any "notes" or "address"
// column with a line break) into two fragments, desyncing every count that
// follows from the file's real column structure.
function splitLogicalLines(sample) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    if (c === '"') { inQuotes = !inQuotes; current += c; continue; }
    if (!inQuotes && (c === '\n' || c === '\r')) {
      if (c === '\r' && sample[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

// Delimiters least likely to appear as incidental noise in free-text data
// win ties, since a tie is most often "every candidate happens to appear
// once per row" rather than genuine ambiguity -- e.g. a tab-delimited file
// with an incidental comma in a city field ("New York, NY") ties comma
// against tab, and tab is the real delimiter.
const TIE_BREAK_PRIORITY = ['\t', '|', ';', ','];

// Sniffs the delimiter from a text sample by trying each candidate and
// keeping the one that splits every sampled logical row into the same
// number of fields (at least 2 columns). Consistency across rows —
// including the header — is the guard against the classic false-positive: a
// European file that uses ';' as the field delimiter and ',' as the decimal
// separator. There, ',' shows up once per numeric data row but zero times
// in the header (header names aren't numbers), so it fails the "same count
// on every row" test and is correctly rejected, while ';' passes. Falls
// back to comma when no candidate is consistent (e.g. a genuine
// single-column file, or too little data to tell).
export function detectDelimiter(sample, candidates = [',', ';', '\t', '|']) {
  if (!sample) return ',';
  const lines = splitLogicalLines(sample).filter((l) => l.length > 0).slice(0, 10);
  if (lines.length === 0) return ',';
  let best = null;
  let bestCount = 0;
  for (const delim of candidates) {
    const counts = lines.map((line) => countUnquoted(line, delim));
    const first = counts[0];
    if (first === 0) continue;
    const consistent = counts.every((c) => c === first);
    if (!consistent) continue;
    const better =
      first > bestCount ||
      (first === bestCount && best !== null &&
        TIE_BREAK_PRIORITY.indexOf(delim) < TIE_BREAK_PRIORITY.indexOf(best));
    if (better) { bestCount = first; best = delim; }
  }
  return best || ',';
}

export function parseCsvRows(input, delimiter = ',') {
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
    if (c === delimiter) { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export class IncrementalCsvParser {
  constructor(onRow, delimiter = ',') {
    this.onRow = onRow;
    this.delimiter = delimiter;
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
    if (c === this.delimiter) { this.row.push(this.field); this.field = ''; return i + 1; }
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
