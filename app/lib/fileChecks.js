// Before reading a file as data (P21, 02/10, robustness): an empty file, a binary file or a file of another kind
// under a CSV / Excel name must get a sentence, never a "result". The robustness bench
// (scripts/browser-tests/p21-robustness.mjs) found CSV to JSON / SQL / TSV / Excel and Excel to CSV / JSON turning a
// PNG named .csv, random bytes or an empty file into an output that looked like a conversion.
import { sniffFormat } from './detectFileFormat.js';
import { detectEncoding } from './csvEncoding.js';

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

/** The whole text of a file textFileProblem accepted, decoded as it was written: UTF-16 (with or without BOM — Excel's
 *  "Unicode Text"), UTF-8, or the visitor's ANSI code page (Excel's CSV on Windows). file.text() is always UTF-8: a
 *  UTF-16 export came out with a NUL between every character (P23 review, Barcode Generator's CSV import). */
export async function decodedText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const u16 = utf16Kind(bytes);
  const enc = u16 || detectEncoding(bytes.subarray(0, 512 * 1024)).encoding;
  return new TextDecoder(enc).decode(bytes); // TextDecoder drops a leading BOM itself
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

// ---- P23 (02/10): pictures and videos the browser cannot open ----------------------------------------------------
// The P22 robustness bench found tools that said nothing, or the wrong thing, for an empty, damaged or wrong file:
// Image Cropper blamed the size ("probably too large") or showed Firefox's raw 'Passed-in image is "broken"'; Video
// Watermark told the owner of a 0-byte file that it "isn't necessarily a broken file"; Video Merger showed
// 'e.streams is undefined' under Firefox. Competitors measured the same day do no better (iLoveIMG: nothing for an
// empty file, a damaged one is taken without a word; Clideo: "Something went wrong, please try again"). Here every
// sentence says what is wrong with THIS file and what to do next.
const IMAGE_KINDS = new Set(['png', 'jpg', 'gif', 'tiff', 'bmp', 'webp', 'ico', 'heic', 'avif']);
const extOfName = (name) => (String(name || '').split('.').pop() || '').toLowerCase();

// The picture's size from its own header (PNG IHDR, GIF screen, JPEG SOF), without decoding it.
function headerPixels(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[12] === 0x49 && b[13] === 0x48) return { width: v.getUint32(16), height: v.getUint32(20) };
  if (b.length >= 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { width: v.getUint16(6, true), height: v.getUint16(8, true) };
  if (b.length >= 30 && b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) { // WebP: VP8X, VP8L or VP8 chunk
    const c = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (c === 'VP8X') return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (c === 'VP8L') { const n = v.getUint32(21, true); return { width: 1 + (n & 0x3fff), height: 1 + ((n >>> 14) & 0x3fff) }; }
    if (c === 'VP8 ') return { width: v.getUint16(26, true) & 0x3fff, height: v.getUint16(28, true) & 0x3fff };
  }
  if (b.length >= 26 && b[0] === 0x42 && b[1] === 0x4d && [40, 52, 56, 108, 124].includes(v.getUint32(14, true))) return { width: Math.abs(v.getInt32(18, true)), height: Math.abs(v.getInt32(22, true)) };
  if (b.length >= 8 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[3] === 0x2a))) { // TIFF: first IFD
    const le = b[0] === 0x49, off = v.getUint32(4, le);
    if (off + 2 <= b.length) {
      const n = v.getUint16(off, le); let width = 0, height = 0;
      for (let k = 0; k < n && off + 2 + k * 12 + 12 <= b.length; k++) {
        const e = off + 2 + k * 12, tag = v.getUint16(e, le), type = v.getUint16(e + 2, le);
        const val = type === 3 ? v.getUint16(e + 8, le) : v.getUint32(e + 8, le);
        if (tag === 256) width = val; else if (tag === 257) height = val;
      }
      if (width && height) return { width, height };
    }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: v.getUint16(i + 7), height: v.getUint16(i + 5) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { i += m === 0xff ? 1 : 2; continue; }
      i += 2 + v.getUint16(i + 2);
    }
  }
  return null;
}
/** {width, height} read from a PNG / GIF / JPEG header, or null. */
export async function imageHeaderSize(file) {
  if (!file || !file.size) return null;
  return headerPixels(new Uint8Array(await file.slice(0, 65536).arrayBuffer()));
}
// Beyond this, a browser may refuse to open a picture at all (Safari's image decoder, a phone's memory).
export const OPENABLE_PIXELS = 100e6;

/** Why a picture could not be opened by this browser (an <img> or createImageBitmap error), in one sentence. */
export async function unreadableImageMessage(file) {
  if (!file || !file.size) return 'This file is empty (0 bytes): there is no picture in it. Choose the image again, or save it again from the app that made it.';
  const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
  const kind = sniffFormat(head);
  const ext = extOfName(file.name);
  const size = kind && headerPixels(head);
  if (size && size.width * size.height > OPENABLE_PIXELS) return `This image is ${size.width.toLocaleString('en-US')} × ${size.height.toLocaleString('en-US')} pixels (${Math.round(size.width * size.height / 1e6)} megapixels): too large for this browser to open. Use a smaller version of the picture.`;
  if (kind?.format === 'gzip' && ext === 'svgz') return 'This browser cannot open a compressed SVG (.svgz). Unpack it to a plain .svg first (our Zip Extractor opens it), then try again.';
  if (kind && !IMAGE_KINDS.has(kind.format)) return `This is not an image: its content is ${kind.label}. It may be another kind of file renamed .${ext}.`;
  if (kind?.format === 'heic') return 'This browser cannot open HEIC photos. Convert it first with our HEIC to JPG tool, or open this page in Safari.';
  if (kind?.format === 'tiff') return 'This browser cannot display TIFF images. Convert it first with our TIFF to JPG tool.';
  return `This image could not be read: it may be damaged, or not an image renamed .${ext}. Open it in a photo app and save it again as JPG or PNG, then try again.`;
}

/** A picture for a tool that opens it with <img> / createImageBitmap: the empty file is said at once. */
export function emptyImageProblem(file) {
  return !file || !file.size ? 'This file is empty (0 bytes): there is no picture in it. Choose the image again, or save it again from the app that made it.' : null;
}

// A video container recognised by its first bytes: MP4 / MOV / 3GP (ftyp, the older QuickTime atoms, fragmented MP4),
// WebM / MKV (EBML), AVI (RIFF…AVI), Ogg, MPEG-TS (sync byte every 188 bytes) and AVCHD .mts / .m2ts (every 192, after
// a 4-byte time code), MPEG-PS / VOB, FLV, ASF / WMV, RealMedia, MXF, IVF, Y4M, raw H.264 / HEVC.
function videoContainer(b) {
  const at = (o, s) => s.every((c, i) => b[o + i] === (typeof c === 'string' ? c.charCodeAt(0) : c));
  if (b.length >= 12 && ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip', 'pnot', 'styp', 'moof', 'sidx', 'uuid'].some((t) => at(4, [...t]))) return true;
  if (at(0, [0x1a, 0x45, 0xdf, 0xa3])) return true;
  if (at(0, [...'RIFF']) && at(8, [...'AVI'])) return true;
  if (at(0, [...'OggS']) || at(0, [...'FLV']) || at(0, [0x30, 0x26, 0xb2, 0x75]) || at(0, [...'.RMF']) || at(0, [...'DKIF']) || at(0, [...'YUV4MPEG2'])) return true;
  if (at(0, [0x06, 0x0e, 0x2b, 0x34])) return true; // MXF
  if (at(0, [0, 0, 1, 0xba]) || at(0, [0, 0, 1, 0xb3]) || at(0, [0, 0, 0, 1]) || (at(0, [0, 0, 1]) && b[3] !== 0)) return true;
  if (b.length >= 377 && b[0] === 0x47 && b[188] === 0x47 && b[376] === 0x47) return true;
  if (b.length >= 389 && b[4] === 0x47 && b[196] === 0x47 && b[388] === 0x47) return true;
  if (b.length >= 409 && b[0] === 0x47 && b[204] === 0x47 && b[408] === 0x47) return true; // TS with 204-byte packets (DVB)
  for (let i = 1; i < 188 && i + 376 < b.length; i++) if (b[i] === 0x47 && b[i + 188] === 0x47 && b[i + 376] === 0x47) return true; // TS cut mid-packet
  if (at(0, [0x1f, 0x07, 0x00]) && (b[3] === 0x3f || b[3] === 0xbf)) return true; // raw DV
  if (at(0, [0xb7, 0xd8, 0x00, 0x20, 0x37, 0x49, 0xda, 0x11])) return true; // WTV
  return false;
}
// Refused as "not a video" only on a strong signature (4 bytes or more): a real .mts file starts with a 4-byte time
// code that can begin with the 2-byte marks of BMP ("BM") or GZIP by chance.
const NOT_VIDEO_KINDS = new Set(['png', 'jpg', 'gif', 'tiff', 'webp', 'pdf', 'zip']);

/** A video before it is opened: empty, or a recognised file of another kind (a picture, a PDF…) → a sentence. */
export async function videoFileProblem(file) {
  if (!file || !file.size) return 'This file is empty (0 bytes): there is no video in it. Choose the video again, or copy it again from the device that recorded it.';
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  if (videoContainer(head)) return null;
  const kind = sniffFormat(head);
  if (kind?.format === 'jpg' && /^mjpe?g$/.test(extOfName(file.name))) return null; // a raw Motion-JPEG stream (IP cameras)
  if (kind && NOT_VIDEO_KINDS.has(kind.format)) return `This is not a video: its content is ${kind.label}. It may be another kind of file renamed .${extOfName(file.name)}.`;
  return null; // unknown start: the browser or ffmpeg is the judge
}

/** Why the browser could not open a video (a <video> error): a damaged file and an unsupported codec are told apart. */
export async function unreadableVideoMessage(file) {
  const first = await videoFileProblem(file);
  if (first) return first;
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  if (!videoContainer(head)) return `This file could not be read as a video: it may be damaged, not a video, or a video format this browser cannot read. Play it in a video player to check, or convert it to MP4 with our Video Converter.`;
  return null; // a real video container: the caller explains that this browser cannot decode its codec
}
