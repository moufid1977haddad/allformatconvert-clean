// PDF to Excel when the PDF has no table (28/09): the sheet is built here from the PDF's text, as the reference
// converters do for a text-only PDF — one sheet per page, one row per line of text, a new cell wherever the text
// jumps across a wide gap (aligned columns stay columns). Free, in the browser, nothing sent anywhere.
import { loadPdfjs } from './pdfjs';
const ROW_TOLERANCE = 2.5; // points: items on the same baseline, within this, are one line

/** @returns {Promise<{ blob: Blob, pages: number, rows: number }>} rows = 0 means the PDF has no text layer (a scan). */
export async function pdfTextToXlsx(file) {
  const pdfjsLib = await loadPdfjs();
  const XLSX = await import('xlsx');
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const wb = XLSX.utils.book_new();
  let rows = 0;
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const { items } = await page.getTextContent();
    const lines = [];
    for (const it of items) {
      if (!it.str || !it.str.trim()) continue;
      const [, , , , x, y] = it.transform;
      let line = lines.find((l) => Math.abs(l.y - y) <= ROW_TOLERANCE);
      if (!line) { line = { y, parts: [] }; lines.push(line); }
      line.parts.push({ x, end: x + (it.width || 0), str: it.str, h: Math.abs(it.transform[3]) || 10 });
    }
    lines.sort((a, b) => b.y - a.y);
    const aoa = lines.map((l) => {
      l.parts.sort((a, b) => a.x - b.x);
      const cells = [];
      let cur = '', prevEnd = null;
      for (const p of l.parts) {
        // a gap wider than ~2 characters starts a new cell; a narrow one is the space between words
        if (prevEnd !== null && p.x - prevEnd > p.h * 1.2) { cells.push(cur.trim()); cur = ''; }
        else if (prevEnd !== null && p.x - prevEnd > p.h * 0.15 && !cur.endsWith(' ') && !p.str.startsWith(' ')) cur += ' ';
        cur += p.str; prevEnd = p.end;
      }
      cells.push(cur.trim());
      return cells;
    });
    rows += aoa.length;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa.length ? aoa : [['']]), `Page ${n}`);
    page.cleanup();
  }
  await pdf.destroy();
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return { blob: new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), pages: pdf.numPages, rows };
}
