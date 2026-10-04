// P32 (04/10) — the "PDF over 4 MB" path of /api/pdf-render, end to end on a deployment: ticket (purpose pdf-render)
// from the site, chunked upload to the real media service (same requests as app/lib/mediaJob.js openAndUpload), start,
// then two pages drawn by the real pdf-tools (/v1/render-page-staged) from the same staged file, then deletion. Run from
// Node because the media service does not send CORS headers to a localhost origin (a browser bench cannot upload).
//   node scripts/p32/staged-render-preview.mjs <site origin, e.g. the preview proxy http://localhost:3200> <media service url>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { PDFDocument } from 'pdf-lib';

const [site, media] = process.argv.slice(2);
const KIT = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : info); };

// a real PDF over 4 MB: the kit photos, one per page
const doc = await PDFDocument.create();
for (const f of [...Array(2)].flatMap(() => ['kit-iphone-p19/photo-48mpx.jpg', 'kit-iphone-p19/photo-24mpx.jpg', 'kit-iphone-p19/photo-12mpx.jpg', 'kit-iphone-p19/photo-portrait.jpg', 'kit-iphone-p21/photo-1.jpg', 'kit-iphone-p21/photo-2.jpg', 'kit-iphone-p21/photo-3.jpg'])) {
  const img = await doc.embedJpg(fs.readFileSync(path.join(KIT, f)));
  const page = doc.addPage([595, 842]);
  const s = Math.min(555 / img.width, 802 / img.height);
  page.drawImage(img, { x: 20, y: 20, width: img.width * s, height: img.height * s });
}
let bytes = Buffer.from(await doc.save({ useObjectStreams: false }));
console.log(`test PDF: ${doc.getPageCount()} pages, ${(bytes.length / 1048576).toFixed(2)} MB`);
check('the test PDF is over the 4 MB direct ceiling', bytes.length > 4 * 1024 * 1024, String(bytes.length));

const tres = await fetch(`${site}/api/media/ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'stage', size: bytes.length, purpose: 'pdf-render' }) });
const t = await tres.json();
check('ticket for purpose pdf-render', tres.ok && t.jid && t.ticket, JSON.stringify(t));
const auth = { Authorization: 'Bearer ' + t.ticket };
const created = await (await fetch(`${media}/v1/jobs`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'stage', size: bytes.length, params: {} }) })).json();
for (let n = 0; n < created.totalChunks; n++) {
  const chunk = bytes.subarray(n * created.chunkBytes, Math.min(bytes.length, (n + 1) * created.chunkBytes));
  const r = await fetch(`${media}/v1/jobs/${t.jid}/chunks/${n}`, { method: 'PUT', headers: { ...auth, 'X-Chunk-Sha256': crypto.createHash('sha256').update(chunk).digest('hex') }, body: chunk });
  if (r.status !== 200) { check(`chunk ${n}`, false, String(r.status)); break; }
}
const st = await fetch(`${media}/v1/jobs/${t.jid}/start`, { method: 'POST', headers: auth });
check(`upload of ${created.totalChunks} chunks + start`, st.status === 202, String(st.status));

for (const [page, format, dpi] of [[1, 'jpg', 150], [6, 'png', 72]]) {
  const t0 = Date.now();
  const r = await fetch(`${site}/api/pdf-render`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' }, body: JSON.stringify({ jid: t.jid, ticket: t.ticket, filename: 'document.pdf', page, dpi, format, quality: 92 }) });
  const b = Buffer.from(await r.arrayBuffer());
  const magicOk = format === 'jpg' ? b[0] === 0xff && b[1] === 0xd8 : b[0] === 0x89 && b[1] === 0x50;
  check(`staged page ${page} ${format.toUpperCase()} ${dpi} dpi by the real pdf-tools: ${r.status}, ${b.length} B, dpi ${r.headers.get('x-render-dpi')}, pages ${r.headers.get('x-render-pages')}, ${Date.now() - t0} ms`, r.ok && magicOk && r.headers.get('x-render-pages') === '14', b.toString().slice(0, 200));
}
const del = await fetch(`${media}/v1/jobs/${t.jid}`, { method: 'DELETE', headers: auth });
check('staged file deleted afterwards', del.ok || del.status === 204 || del.status === 404, String(del.status));
const after = await fetch(`${site}/api/pdf-render`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jid: t.jid, ticket: t.ticket, page: 1, dpi: 72, format: 'jpg' }) });
check(`after deletion the file is gone (${after.status})`, after.status === 410 || after.status === 404, String(after.status));
console.log(fails ? `${fails} FAIL, ${passes} pass` : `ALL PASS: ${passes} checks`);
process.exit(fails ? 1 : 0);
