// Emoji and other characters beyond U+FFFF in .xlsx files (29/09).
//
// Measured: an .xlsx written by Python's openpyxl (and so pandas.to_excel)
// stores "😀" as the XML character reference &#128512;. The xlsx library
// (SheetJS, 0.18.5 here and 0.20.3 alike) decodes such a reference with
// String.fromCharCode, which keeps only the low 16 bits: 😀 (U+1F600) came
// out of Excel to CSV and Excel to JSON as U+F600, an invisible private-use
// character -- without any warning.
//
// Before parsing, references >= 0x10000 inside the workbook's XML parts are
// replaced by the characters themselves (which XML allows), and the archive is
// rebuilt without compression. Files without such references -- including
// every file saved by Excel or LibreOffice, which write UTF-8 directly -- are
// passed through untouched.
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';

const XML_PART = /^xl\/(sharedStrings|workbook|worksheets\/[^/]+|comments\d*)\.xml$/i;
const SUPPLEMENTARY_REF = /&#(?:[xX]([0-9a-fA-F]+)|([0-9]+));/g;

function hasSupplementaryRef(text) {
  SUPPLEMENTARY_REF.lastIndex = 0;
  let m;
  while ((m = SUPPLEMENTARY_REF.exec(text))) {
    const cp = m[1] ? parseInt(m[1], 16) : parseInt(m[2], 10);
    if (cp >= 0x10000 && cp <= 0x10ffff) return true;
  }
  return false;
}

export function fixSupplementaryCharRefs(bytes) {
  // Only ZIP-based workbooks (.xlsx, .xlsm, .ods); .xls and .csv are not affected.
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) return { bytes, fixed: 0 };
  let parts;
  try {
    parts = unzipSync(bytes, { filter: (f) => XML_PART.test(f.name) });
  } catch {
    return { bytes, fixed: 0 }; // not a readable zip: let the parser report it
  }
  const affected = Object.keys(parts).filter((name) => hasSupplementaryRef(strFromU8(parts[name])));
  if (affected.length === 0) return { bytes, fixed: 0 };

  const all = unzipSync(bytes);
  let fixed = 0;
  for (const name of affected) {
    const text = strFromU8(all[name]).replace(SUPPLEMENTARY_REF, (ref, hex, dec) => {
      const cp = hex ? parseInt(hex, 16) : parseInt(dec, 10);
      if (cp < 0x10000 || cp > 0x10ffff) return ref;
      fixed++;
      return String.fromCodePoint(cp);
    });
    all[name] = strToU8(text);
  }
  return { bytes: zipSync(all, { level: 0 }), fixed };
}
