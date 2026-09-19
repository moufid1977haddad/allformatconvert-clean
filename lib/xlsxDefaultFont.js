// A .xlsx font entry with no <name> child (what openpyxl writes for
// Font(bold=True), and what several other generators emit) means "the
// workbook's default font" to Excel -- its own output for such cells is
// Calibri-Bold (measured: docs/audit/RAPPORT-fidelite-corrections.md, D1).
// LibreOffice has no such rule: it resolves an empty name to a serif
// fallback (Caladea-Bold in our Gotenberg image), so bold headers in those
// workbooks came out in a serif face. Files whose fonts all carry a name,
// including everything Excel itself writes, convert correctly and are
// returned untouched.
//
// This gives each nameless entry inside <fonts> the name of font 0 (the
// default "Normal" style font). <dxfs> is deliberately left alone: a
// differential format's font with no name means "inherit", not "default".
import JSZip from 'jszip';

const STYLES_PATH = 'xl/styles.xml';

// Returns { buffer, patched }. `patched` is the number of font entries that
// received a name (0 = buffer returned as-is, byte for byte). Throws if the
// archive or styles part cannot be read; the caller decides how to report it.
export async function nameNamelessFonts(inputBuffer) {
  const zip = await JSZip.loadAsync(inputBuffer);
  const entry = zip.file(STYLES_PATH);
  if (!entry) return { buffer: inputBuffer, patched: 0 };

  const xml = await entry.async('string');
  const block = /<fonts(\s[^>]*)?>([\s\S]*?)<\/fonts>/.exec(xml);
  if (!block) return { buffer: inputBuffer, patched: 0 };

  const fontRe = /<font(\s[^>]*)?(?:\/>|>([\s\S]*?)<\/font>)/g;
  const entries = [...block[2].matchAll(fontRe)];
  if (entries.length === 0) return { buffer: inputBuffer, patched: 0 };

  const nameRe = /<name\s+val="([^"]*)"/i;
  const defaultName = nameRe.exec(entries[0][2] || '')?.[1];
  if (!defaultName) return { buffer: inputBuffer, patched: 0 };

  let patched = 0;
  const newInner = block[2].replace(fontRe, (whole, attrs, inner) => {
    if (nameRe.test(inner || '')) return whole;
    patched += 1;
    return `<font${attrs || ''}>${inner || ''}<name val="${defaultName}"/></font>`;
  });
  if (patched === 0) return { buffer: inputBuffer, patched: 0 };

  const newXml = xml.slice(0, block.index)
    + block[0].replace(block[2], () => newInner)
    + xml.slice(block.index + block[0].length);
  zip.file(STYLES_PATH, newXml);
  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { buffer: out, patched };
}
