// Label sheets as one vector PDF: the codes of "Many" placed on die-cut label sheets (A4 / US Letter) or on thermal
// roll labels (one label per page). barcode-maker.com has this (read on 26/09/2026) but stretches every code to the
// label's width, so the module width -- what a scanner and GS1 care about -- depends on the label. Here a code keeps
// the size set on the page and is only shrunk when it does not fit (and the page says by how much), or enlarged
// when the visitor asks to fill the label.
//
// Sheet geometry from the manufacturers' templates (all in mm): page, label w/h, columns x rows, top and left
// margins, horizontal and vertical gaps between labels.
const IN = 25.4;
export const TEMPLATES = [
  { id: 'L7160', label: 'A4 · 63.5 × 38.1 mm · 21 per sheet (Avery L7160, J8160)', paper: 'A4', w: 63.5, h: 38.1, cols: 3, rows: 7, top: 15.15, left: 7.25, gapX: 2.5, gapY: 0 },
  { id: 'L7163', label: 'A4 · 99.1 × 38.1 mm · 14 per sheet (Avery L7163, J8163)', paper: 'A4', w: 99.1, h: 38.1, cols: 2, rows: 7, top: 15.15, left: 4.65, gapX: 2.5, gapY: 0 },
  { id: 'L7651', label: 'A4 · 38.1 × 21.2 mm · 65 per sheet (Avery L7651, J8651)', paper: 'A4', w: 38.1, h: 21.2, cols: 5, rows: 13, top: 10.7, left: 4.75, gapX: 2.5, gapY: 0 },
  { id: 'L7674', label: 'A4 · 145 × 17 mm · 16 per sheet (Avery L7674)', paper: 'A4', w: 145, h: 17, cols: 1, rows: 16, top: 12.5, left: 32.5, gapX: 0, gapY: 0 },
  { id: '5160', label: 'US Letter · 2⅝ × 1 in · 30 per sheet (Avery 5160, 8160)', paper: 'Letter', w: 2.625 * IN, h: 1 * IN, cols: 3, rows: 10, top: 0.5 * IN, left: 0.1875 * IN, gapX: 0.125 * IN, gapY: 0 },
  { id: '5163', label: 'US Letter · 4 × 2 in · 10 per sheet (Avery 5163, 8163)', paper: 'Letter', w: 4 * IN, h: 2 * IN, cols: 2, rows: 5, top: 0.5 * IN, left: 0.15625 * IN, gapX: 0.1875 * IN, gapY: 0 },
  { id: '5167', label: 'US Letter · 1¾ × ½ in · 80 per sheet (Avery 5167, 8167)', paper: 'Letter', w: 1.75 * IN, h: 0.5 * IN, cols: 4, rows: 20, top: 0.5 * IN, left: 0.3 * IN, gapX: 0.3 * IN, gapY: 0 },
  { id: 'plainA4', label: 'Plain A4 paper, to cut · 3 × 7', paper: 'A4', w: 70, h: 297 / 7, cols: 3, rows: 7, top: 0, left: 0, gapX: 0, gapY: 0 },
  { id: 'plainLetter', label: 'Plain US Letter paper, to cut · 3 × 10', paper: 'Letter', w: (8.5 * IN) / 3, h: (11 * IN) / 10, cols: 3, rows: 10, top: 0, left: 0, gapX: 0, gapY: 0 },
];
export const ROLLS = [[40, 30], [50, 30], [50, 25], [57, 32], [60, 40], [80, 50], [100, 50], [100, 100], [100, 150], [4 * IN, 6 * IN]];
export const PAPERS = { A4: [210, 297], Letter: [8.5 * IN, 11 * IN] };
export const LABEL_INSET_MM = 1; // kept blank inside each label: die-cut and printer tolerance
export const MAX_LABELS = 5000;

// labels: { kind: 'sheet'|'roll', paper, pageW, pageH, w, h, cols, rows, top, left, gapX, gapY, start, copies,
//           guides, fit: 'keep'|'fill' }
export function sheetOf(t) { const [pageW, pageH] = PAPERS[t.paper]; return { kind: 'sheet', template: t.id, paper: t.paper, pageW, pageH, w: t.w, h: t.h, cols: t.cols, rows: t.rows, top: t.top, left: t.left, gapX: t.gapX, gapY: t.gapY }; }
export const rollOf = (w, h) => ({ kind: 'roll', template: `${w}x${h}`, pageW: w, pageH: h, w, h, cols: 1, rows: 1, top: 0, left: 0, gapX: 0, gapY: 0 });

// '' when the layout fits its page, else what is wrong.
export function layoutError(L) {
  const n = (v) => Number(v);
  if (!(n(L.w) > 0 && n(L.h) > 0 && n(L.cols) >= 1 && n(L.rows) >= 1)) return 'Set the label size, columns and rows.';
  if (L.kind === 'sheet') {
    const right = n(L.left) + n(L.cols) * n(L.w) + (n(L.cols) - 1) * n(L.gapX); const bottom = n(L.top) + n(L.rows) * n(L.h) + (n(L.rows) - 1) * n(L.gapY);
    if (right > n(L.pageW) + 0.01 || bottom > n(L.pageH) + 0.01) return `These labels do not fit on the page: they reach ${right.toFixed(1)} × ${bottom.toFixed(1)} mm on a ${n(L.pageW).toFixed(1)} × ${n(L.pageH).toFixed(1)} mm sheet.`;
  }
  if (!(n(L.start) >= 1)) return 'Start at label 1 or later.';
  return '';
}

// Scale of each code on its label: 1 = the size set on the page.
export function scaleFor(code, L) {
  const pt = 72 / 25.4; const aw = (Number(L.w) - 2 * LABEL_INSET_MM) * pt; const ah = (Number(L.h) - 2 * LABEL_INSET_MM) * pt;
  const fit = Math.min(aw / code.w, ah / code.h);
  return L.fit === 'fill' ? fit : Math.min(1, fit);
}

/* ---------- PDF writer, bytes (compressed streams are binary) ---------- */
const enc = new TextEncoder();
const n3 = (v) => String(Math.round(v * 1000) / 1000);
async function deflate(u8) { // FlateDecode where the browser has CompressionStream (all current ones), else stored plain
  if (typeof CompressionStream === 'undefined') return null;
  const s = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
async function streamObj(dict, text) {
  const raw = enc.encode(text); const z = await deflate(raw);
  const data = z || raw;
  return [enc.encode(`<< ${dict}${z ? ' /Filter /FlateDecode' : ''} /Length ${data.length} >>\nstream\n`), data, enc.encode('\nendstream')];
}

// codes: [{ content, w, h }] in points (pdfContent), one per value; returns { bytes, pages, labels, minScale }.
export async function labelPdf(codes, L) {
  const pt = 72 / 25.4; const perPage = Number(L.cols) * Number(L.rows);
  const copies = Math.max(1, Math.floor(Number(L.copies) || 1));
  const first = L.kind === 'sheet' ? Math.max(1, Math.floor(Number(L.start) || 1)) - 1 : 0;
  const slots = []; codes.forEach((c, i) => { for (let k = 0; k < copies; k++) slots.push(i); });
  const pages = Math.ceil((first + slots.length) / perPage);
  // objects: 1 catalog, 2 pages, 3 info, then one Form XObject per code, then page + content per page
  const objs = []; const add = (parts) => { objs.push(parts); return objs.length + 3; };
  const xo = []; let minScale = Infinity;
  for (const c of codes) xo.push(add(await streamObj(`/Type /XObject /Subtype /Form /BBox [0 0 ${n3(c.w)} ${n3(c.h)}] /Resources << >>`, c.content)));
  const pageIds = [];
  const cellX = (col) => (Number(L.left) + col * (Number(L.w) + Number(L.gapX))) * pt;
  const cellTop = (row) => (Number(L.top) + row * (Number(L.h) + Number(L.gapY))) * pt;
  const PW = Number(L.pageW) * pt, PH = Number(L.pageH) * pt, W = Number(L.w) * pt, H = Number(L.h) * pt;
  for (let p = 0; p < pages; p++) {
    const ops = []; const names = new Set();
    for (let k = 0; k < perPage; k++) {
      const s = p * perPage + k - first; if (s < 0 || s >= slots.length) continue;
      const col = k % Number(L.cols), row = Math.floor(k / Number(L.cols));
      const x0 = cellX(col), y0 = PH - cellTop(row) - H; // label's bottom-left
      if (L.guides) ops.push(`q 0.6 0.6 0.6 RG 0.25 w [2 2] 0 d ${n3(x0)} ${n3(y0)} ${n3(W)} ${n3(H)} re S Q`);
      const i = slots[s]; const c = codes[i]; const k2 = scaleFor(c, L); minScale = Math.min(minScale, k2);
      const x = x0 + (W - c.w * k2) / 2, y = y0 + (H - c.h * k2) / 2;
      ops.push(`q ${n3(k2)} 0 0 ${n3(k2)} ${n3(x)} ${n3(y)} cm /C${i} Do Q`); names.add(i);
    }
    if (L.guides && L.kind === 'sheet') for (let k = 0; k < perPage; k++) { // empty labels too, so the sheet can be lined up
      const s = p * perPage + k - first; if (s >= 0 && s < slots.length) continue;
      const col = k % Number(L.cols), row = Math.floor(k / Number(L.cols));
      ops.push(`q 0.8 0.8 0.8 RG 0.25 w [1 3] 0 d ${n3(cellX(col))} ${n3(PH - cellTop(row) - H)} ${n3(W)} ${n3(H)} re S Q`);
    }
    const contentId = add(await streamObj('', ops.join('\n')));
    const xobjs = [...names].map((i) => `/C${i} ${xo[i]} 0 R`).join(' ');
    pageIds.push(add([enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n3(PW)} ${n3(PH)}] /Contents ${contentId} 0 R /Resources << /XObject << ${xobjs} >> >> >>`)]));
  }
  const head = [
    [enc.encode('<< /Type /Catalog /Pages 2 0 R >>')],
    [enc.encode(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages} >>`)],
    [enc.encode('<< /Producer (onlineconvertools.com Barcode Generator, bwip-js) >>')],
  ];
  const all = [...head, ...objs];
  const parts = [Uint8Array.of(...enc.encode('%PDF-1.5\n%'), 0xe2, 0xe3, 0xcf, 0xd3, 10)]; let off = parts[0].length; const offsets = [];
  all.forEach((o, i) => { offsets.push(off); const pre = enc.encode(`${i + 1} 0 obj\n`), post = enc.encode('\nendobj\n'); for (const x of [pre, ...o, post]) { parts.push(x); off += x.length; } });
  const xref = off;
  parts.push(enc.encode(`xref\n0 ${all.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${all.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  const bytes = new Uint8Array(off + parts.at(-1).length); let o = 0; for (const x of parts) { bytes.set(x, o); o += x.length; }
  return { bytes, pages, labels: slots.length, minScale: minScale === Infinity ? 1 : minScale };
}
