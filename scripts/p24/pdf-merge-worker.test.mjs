// P24 (03/10): PDF Merge's worker run in Node (bundled by esbuild); the merged PDF read back by pdf.js. Before: the
// form stopped working (no AcroForm) and the bookmarks were lost, without a word; two fields named alike would share
// one value.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../..');
const require = createRequire(path.join(root, 'package.json'));
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'p24-merge-')), 'worker.mjs');
execFileSync('npx', ['-y', 'esbuild', JSON.stringify(path.join(root, 'app/tools/pdf-tools/pdf-merge/pdfMerge.worker.js')), '--bundle', '--format=esm', '--platform=neutral', '--main-fields=module,main', `--outfile=${JSON.stringify(out)}`, '--log-level=error'], { shell: true, cwd: root });
const { PDFDocument, PDFName, PDFHexString } = require('pdf-lib');
const msgs = [];
globalThis.self = { postMessage: (m) => msgs.push(m) };
await import(pathToFileURL(out).href);
const handler = self.onmessage, sink = self;
const run = async (data) => { msgs.length = 0; globalThis.self = sink; await handler({ data }); for (let i = 0; i < 80 && !msgs.some((m) => ['done', 'error', 'limit'].includes(m.type)); i++) await new Promise((r) => setTimeout(r, 100)); return msgs.find((m) => ['done', 'error', 'limit'].includes(m.type)); };
async function makePdf(label, pages, value) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300, 300]);
  const form = doc.getForm(); const f = form.createTextField('name'); f.setText(value); f.addToPage(doc.getPage(0), { x: 20, y: 200, width: 150, height: 24 });
  // one bookmark per page: "<label> p<n>"
  const ctx = doc.context, items = doc.getPages().map((p, i) => ctx.obj({ Title: PDFHexString.fromText(`${label} p${i + 1}`), Dest: [p.ref, PDFName.of('Fit')] }));
  const refs = items.map((d) => ctx.register(d)); const rootRef = ctx.register(ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[refs.length - 1], Count: refs.length }));
  items.forEach((d, i) => { d.set(PDFName.of('Parent'), rootRef); if (i) d.set(PDFName.of('Prev'), refs[i - 1]); if (i < refs.length - 1) d.set(PDFName.of('Next'), refs[i + 1]); });
  doc.catalog.set(PDFName.of('Outlines'), rootRef);
  return new File([await doc.save()], `${label}.pdf`, { type: 'application/pdf' });
}
const done = await run({ files: [await makePdf('Alpha', 2, 'Ann'), await makePdf('Beta', 3, 'Bob')], maxPages: 1000 });
const bytes = new Uint8Array(await done.blob.arrayBuffer());
const pdfjs = await import(pathToFileURL(path.join(root, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise; // pdf.js takes (detaches) the buffer it is given
const fields = await doc.getFieldObjects();
const outline = await doc.getOutline();
const names = Object.keys(fields || {}).sort();
const values = names.map((n) => fields[n].find((o) => o.value !== undefined)?.value); // pdf.js lists the field, then its widget
const tree = (outline || []).map((o) => `${o.title}[${(o.items || []).map((c) => c.title).join(',')}]`).join(' ');
const destPage = async (o) => doc.getPageIndex(Array.isArray(o.dest) ? o.dest[0] : (await doc.getDestination(o.dest))[0]);
const betaFirst = outline?.[1] ? await destPage(outline[1]) : -1;
const ok1 = doc.numPages === 5 && names.join() === 'name,name_2' && values.join() === 'Ann,Bob';
const ok2 = tree === 'Alpha[Alpha p1,Alpha p2] Beta[Beta p1,Beta p2,Beta p3]' && betaFirst === 2;
console.log(ok1 ? 'PASS' : 'FAIL', 'two forms kept, same-named field renamed, each keeps its value', names.join(), values.join(), JSON.stringify(done.renamed));
console.log(ok2 ? 'PASS' : 'FAIL', 'one bookmark per file with its own bookmarks, pointing at the right pages', tree, 'Beta →', betaFirst);
console.log(ok1 && ok2 ? 'pdf-merge-worker: all passed' : 'pdf-merge-worker: FAILED');
process.exitCode = ok1 && ok2 ? 0 : 1;
