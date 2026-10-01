// Before reading a file as data (P21, 02/10, robustness): an empty file, a binary file or a file of another kind
// under a CSV / Excel name must get a sentence, never a "result". The robustness bench
// (scripts/browser-tests/p21-robustness.mjs) found CSV to JSON / SQL / TSV / Excel and Excel to CSV / JSON turning a
// PNG named .csv, random bytes or an empty file into an output that looked like a conversion.
import { sniffFormat } from './detectFileFormat.js';

const emptyMessage = (what) => `This file is empty (0 bytes), so there is nothing to convert. Choose the ${what} file again, or export it again from the program that made it.`;

// UTF-16 text (Excel's "Unicode Text", some CSV exports) has a NUL in every other byte: recognised by its BOM, or by
// one byte in two being NUL while the other is printable, and then judged on its decoded characters.
function utf16Kind(bytes) {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
  const n = Math.min(bytes.length, 4096) & ~1;
  if (n < 8) return null;
  let evenNul = 0, oddNul = 0;
  for (let i = 0; i < n; i += 2) { if (bytes[i] === 0) evenNul++; if (bytes[i + 1] === 0) oddNul++; }
  const half = n / 2;
  if (oddNul > half * 0.4 && evenNul < half * 0.05) return 'utf-16le';
  if (evenNul > half * 0.4 && oddNul < half * 0.05) return 'utf-16be';
  return null;
}
// Share of characters that are control characters other than tab, line feed, carriage return and form feed — or NUL.
function looksBinary(bytes) {
  if (!bytes.length) return false;
  const u16 = utf16Kind(bytes);
  if (u16) {
    const text = new TextDecoder(u16).decode(bytes.subarray(0, bytes.length & ~1));
    let bad = 0;
    for (const ch of text) { const c = ch.codePointAt(0); if (c === 0 || (c < 32 && c !== 9 && c !== 10 && c !== 13 && c !== 12)) bad++; }
    return bad / Math.max(1, text.length) > 0.02;
  }
  let bad = 0;
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c === 0) return true;
    if (c < 32 && c !== 9 && c !== 10 && c !== 13 && c !== 12) bad++;
  }
  return bad / bytes.length > 0.02;
}

// A recognised non-text format at the start of a "text" file. Two-byte signatures are not trusted on their own: a CSV
// whose first cell is "BMW" or "BMI" starts with the BMP mark "BM" (review, 02/10) — a real BMP also has a DIB header
// of a known size at offset 14.
function otherFormat(head, size) {
  const kind = sniffFormat(head);
  if (!kind) return null;
  if (kind.format === 'bmp') {
    const dib = head.length >= 18 ? head[14] | (head[15] << 8) | (head[16] << 16) | (head[17] << 24) : 0;
    const declared = head.length >= 6 ? head[2] | (head[3] << 8) | (head[4] << 16) | (head[5] << 24) : 0;
    if (![12, 40, 52, 56, 108, 124].includes(dib) && declared !== size) return null;
  }
  return kind;
}

/** A text data file (CSV, TSV, TXT): null when it can be read as text, else a sentence for the visitor. */
export async function textFileProblem(file, what = 'CSV') {
  if (!file || !file.size) return emptyMessage(what);
  const head = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
  const kind = otherFormat(head, file.size);
  if (kind) {
    const workbook = kind.format === 'zip' || (head[0] === 0xd0 && head[1] === 0xcf);
    return `This is not a ${what} text file: its content is ${kind.label}.${workbook ? ' For an Excel or OpenDocument workbook, use our Excel to CSV or Excel to JSON tool.' : ''}`;
  }
  if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) {
    return `This is not a ${what} text file: it is an older Microsoft Office file (for example .xls). For an Excel workbook, use our Excel to CSV or Excel to JSON tool.`;
  }
  if (looksBinary(head)) return `This file is not text, so it cannot be a ${what} file. It may be damaged, or another kind of file renamed .${(file.name.split('.').pop() || '').toLowerCase()}.`;
  return null;
}

/** A spreadsheet (XLSX, XLS, ODS, or CSV where the tool takes it): null when it looks like one, else a sentence. */
export async function spreadsheetProblem(file, { allowCsv = false } = {}) {
  if (!file || !file.size) return emptyMessage('spreadsheet');
  const head = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
  const zip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  const ole = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
  if (zip || ole) return null; // XLSX / ODS (ZIP) or XLS (OLE2): the reader says if it is not a workbook after all
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  // Text is let through to the spreadsheet reader: banks and ERPs export ".xls" files that are really HTML tables,
  // SpreadsheetML 2003 XML or tab-separated text, and Excel opens them (review, 02/10); so does the reader.
  void allowCsv;
  if (!looksBinary(head) && !otherFormat(head, file.size)) return null;
  const kind = otherFormat(head, file.size);
  return `This is not an Excel or OpenDocument spreadsheet${kind ? `: its content is ${kind.label}` : ' (an .xlsx, .xls or .ods file)'}. It may be damaged, or another kind of file renamed .${ext}.`;
}

/** Any file a tool reads whole: only the empty case (the content itself is the tool's to judge). */
export function emptyFileProblem(file, what = 'file') {
  return !file || !file.size ? `This file is empty (0 bytes): there is nothing to ${what === 'file' ? 'process' : what}. Choose the file again.` : null;
}

/** A PDF a tool will open: empty, or not a PDF at all (a PDF starts with "%PDF-" within its first 1 KB). */
export async function pdfFileProblem(file) {
  if (!file || !file.size) return emptyMessage('PDF');
  const head = new TextDecoder('latin1').decode(new Uint8Array(await file.slice(0, 1024).arrayBuffer()));
  if (!head.includes('%PDF-')) {
    const kind = sniffFormat(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
    return `This is not a PDF${kind ? `: its content is ${kind.label}` : ''}. It may be damaged, or another kind of file renamed .pdf.`;
  }
  return null;
}

/** A MOBI / AZW / AZW3 book: a Palm database whose type is BOOKMOBI (or a Topaz / KF8 container). */
export async function mobiFileProblem(file) {
  if (!file || !file.size) return emptyMessage('ebook');
  const h = new TextDecoder('latin1').decode(new Uint8Array(await file.slice(0, 80).arrayBuffer()));
  if (h.slice(60, 68) === 'BOOKMOBI' || h.slice(60, 68) === 'TEXtREAd' || h.startsWith('TPZ')) return null;
  return 'This is not a MOBI / AZW ebook: it may be damaged, or another kind of file renamed. (Kindle books bought from Amazon are usually DRM-protected: no converter can read those.)';
}

/** A PDF that needs a password to open (an owner-only password is fine: it opens with an empty one), said at once
 *  instead of after the visitor has done the work (P21: PDF Sign / Redact spoke only at the last click). */
export async function pdfLockedProblem(file) {
  const { openablePdfBytes, PdfNeedsPasswordError } = await import('./pdfDecrypt.js');
  try {
    await openablePdfBytes(new Uint8Array(await file.arrayBuffer()));
    return null;
  } catch (e) {
    if (e instanceof PdfNeedsPasswordError) return e.message;
    return null; // anything else is for the tool's own reader to report
  }
}
