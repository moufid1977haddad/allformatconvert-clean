// Encoding and number detection for every CSV-reading tool (csv-to-json,
// csv-to-excel, csv-to-sql, csv-to-tsv), next to the shared parser in
// csvParser.js.
//
// Encoding. Excel's classic "CSV" / "CSV (séparateur : point-virgule)" export is
// NOT UTF-8: it is written in the Windows "ANSI" code page of the machine that
// saved it (Windows-1252 in Western Europe and the Americas, 1251 for Cyrillic,
// Shift_JIS in Japan…), with nothing in the file saying so. Decoding it as UTF-8
// turns every "é" into "�" -- silently (measured on a real Excel export, 28/09).
// Reference converters (ConvertCSV, TableConvert) auto-detect the encoding and
// let the visitor override it; so do we:
//   1. a byte-order mark decides (UTF-8, UTF-16 LE/BE);
//   2. otherwise, bytes that are valid UTF-8 are UTF-8 (pure ASCII included);
//   3. otherwise the file is legacy "ANSI": the code page Excel itself uses on
//      the visitor's system, guessed from the browser language (the file was
//      most likely saved by an Excel with the same regional settings).
// Every label below is decoded natively by TextDecoder in Chromium, Firefox and
// Safari (WHATWG Encoding Standard).

export const CSV_ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'windows-1252', label: 'Western European (Windows-1252, Excel "CSV")' },
  { value: 'windows-1250', label: 'Central European (Windows-1250)' },
  { value: 'windows-1251', label: 'Cyrillic (Windows-1251)' },
  { value: 'windows-1253', label: 'Greek (Windows-1253)' },
  { value: 'windows-1254', label: 'Turkish (Windows-1254)' },
  { value: 'windows-1255', label: 'Hebrew (Windows-1255)' },
  { value: 'windows-1256', label: 'Arabic (Windows-1256)' },
  { value: 'windows-1257', label: 'Baltic (Windows-1257)' },
  { value: 'windows-1258', label: 'Vietnamese (Windows-1258)' },
  { value: 'windows-874', label: 'Thai (Windows-874)' },
  { value: 'shift_jis', label: 'Japanese (Shift_JIS)' },
  { value: 'gbk', label: 'Chinese Simplified (GBK)' },
  { value: 'big5', label: 'Chinese Traditional (Big5)' },
  { value: 'euc-kr', label: 'Korean (EUC-KR)' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
];

export function encodingLabel(value) {
  const e = CSV_ENCODINGS.find((x) => x.value === value);
  return e ? e.label : value;
}

// The ANSI code page Windows (hence Excel) uses for a UI language.
export function ansiCodePageFor(lang) {
  const l = String(lang || '').toLowerCase();
  const p = l.split('-')[0];
  if (p === 'zh' && (/-(tw|hk|mo)$/.test(l) || l.includes('hant'))) return 'big5';
  const map = {
    ru: 'windows-1251', uk: 'windows-1251', be: 'windows-1251', bg: 'windows-1251', sr: 'windows-1251', mk: 'windows-1251', kk: 'windows-1251',
    pl: 'windows-1250', cs: 'windows-1250', sk: 'windows-1250', hu: 'windows-1250', sl: 'windows-1250', hr: 'windows-1250', ro: 'windows-1250', bs: 'windows-1250', sq: 'windows-1250',
    el: 'windows-1253', tr: 'windows-1254', az: 'windows-1254', he: 'windows-1255', ar: 'windows-1256', fa: 'windows-1256', ur: 'windows-1256',
    lt: 'windows-1257', lv: 'windows-1257', et: 'windows-1257', vi: 'windows-1258', th: 'windows-874',
    ja: 'shift_jis', zh: 'gbk', ko: 'euc-kr',
  };
  return map[p] || 'windows-1252';
}

// Is `bytes` valid UTF-8? A multi-byte sequence cut by the end of a sample
// does not count as invalid.
export function isValidUtf8(bytes) {
  let i = 0;
  const n = bytes.length;
  while (i < n) {
    const b = bytes[i];
    if (b < 0x80) { i++; continue; }
    let need;
    if (b >= 0xc2 && b <= 0xdf) need = 1;
    else if (b >= 0xe0 && b <= 0xef) need = 2;
    else if (b >= 0xf0 && b <= 0xf4) need = 3;
    else return false;
    for (let k = 1; k <= need; k++) {
      if (i + k >= n) return true; // cut by the end of the sample: what is there was valid
      if ((bytes[i + k] & 0xc0) !== 0x80) return false;
    }
    if (b === 0xe0 && bytes[i + 1] < 0xa0) return false; // overlong
    if (b === 0xed && bytes[i + 1] > 0x9f) return false; // UTF-16 surrogates
    if (b === 0xf0 && bytes[i + 1] < 0x90) return false;
    if (b === 0xf4 && bytes[i + 1] > 0x8f) return false;
    i += need + 1;
  }
  return true;
}

// { encoding, reason: 'bom' | 'valid' | 'ansi' } from the first bytes of a file.
export function detectEncoding(bytes, lang = (typeof navigator !== 'undefined' ? navigator.language : 'en')) {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { encoding: 'utf-8', reason: 'bom' };
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return { encoding: 'utf-16le', reason: 'bom' };
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return { encoding: 'utf-16be', reason: 'bom' };
  if (isValidUtf8(bytes)) return { encoding: 'utf-8', reason: 'valid' };
  return { encoding: ansiCodePageFor(lang), reason: 'ansi' };
}

export const ENCODING_SAMPLE_BYTES = 512 * 1024;

// Reads the start of a File once: the detected encoding and a decoded text
// sample (for the delimiter detection).
export async function sniffCsvFile(file, sampleBytes = 64 * 1024) {
  const head = new Uint8Array(await file.slice(0, ENCODING_SAMPLE_BYTES).arrayBuffer());
  const det = detectEncoding(head);
  const text = new TextDecoder(det.encoding).decode(head.subarray(0, Math.min(head.length, sampleBytes)));
  return { ...det, text };
}

// ---------------------------------------------------------------------------
// Numbers. Excel writes numbers with the decimal separator of its regional
// settings: "12,5" in a French/German/… export (whose fields are then
// separated by ';'), "12.5" in an English one. TableConvert and ConvertCSV
// detect types, and Excel turns such cells into numbers when it opens the
// file. A column is typed numeric only when EVERY non-empty value in it is a
// number written the same way -- never when a value has a leading zero
// ("0612345678", "007", a postcode) or more than 15 significant digits (beyond
// what a spreadsheet or a JSON number keeps exactly): those stay text, as written.

const GROUP = '[\\u0020\\u00a0\\u202f.]'; // thousands groups in a decimal-comma locale

// Which decimal separator this file's numbers use: ',' only when the fields
// are not separated by ','.
export function detectDecimalSeparator(rows, delimiter) {
  if (delimiter === ',') return '.';
  const commaRe = new RegExp(`^[-+]?(\\d+|\\d{1,3}(${GROUP}\\d{3})+),\\d+$`);
  let comma = 0, dot = 0;
  for (const r of rows.slice(0, 500)) for (const v of r) {
    const s = String(v ?? '').trim();
    if (commaRe.test(s)) comma++;
    else if (/^[-+]?\d+\.\d+$/.test(s) && !/^[-+]?\d{1,3}\.\d{3}$/.test(s)) dot++;
  }
  if (comma || dot) return comma >= dot ? ',' : '.';
  return delimiter === ';' ? ',' : '.';
}

const COMMA_NUM = new RegExp(`^([-+]?)(\\d{1,3}(?:${GROUP}\\d{3})+|\\d+)(?:,(\\d+))?$`);
const DOT_NUM = /^([-+]?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/;

// The value of `s` as a number, or null when it is not a number written with
// `decimalSep` ("1 234,5", "1.234,5" / "1,234.5" thousands groups allowed).
export function parseLocaleNumber(s, decimalSep) {
  const t = String(s ?? '').trim();
  if (!t) return null;
  const m = (decimalSep === ',' ? COMMA_NUM : DOT_NUM).exec(t);
  if (!m) return null;
  const intDigits = m[2].replace(/\D/g, '');
  if (intDigits.length > 1 && intDigits[0] === '0') return null; // leading zero: an identifier, keep as text
  if ((intDigits + (m[3] || '')).replace(/^0+/, '').length > 15) return null; // would lose digits
  const n = Number(`${m[1]}${intDigits}${m[3] ? '.' + m[3] : ''}`);
  return Number.isFinite(n) ? n : null;
}

// For each column (header row excluded): true when every non-empty value
// parses as a number with `decimalSep`, and at least one value is present.
export function numericColumns(rows, decimalSep) {
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  const out = [];
  for (let c = 0; c < width; c++) {
    let any = false, ok = true;
    for (let r = 1; r < rows.length && ok; r++) {
      const v = rows[r][c];
      if (v === undefined || String(v).trim() === '') continue;
      any = true;
      if (parseLocaleNumber(v, decimalSep) === null) ok = false;
    }
    out.push(any && ok);
  }
  return out;
}
