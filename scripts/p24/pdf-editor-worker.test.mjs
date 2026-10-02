// P24 (03/10): PDF Editor's worker, run in Node (bundled by esbuild), its saved PDF read back by pdf.js — an
// independent reader. Before the fix the added image was never painted (embedded in the source document, drawn on
// the copied page of another document) and non-Latin text gave a raw pdf-lib error.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../..');
const require = createRequire(path.join(root, 'package.json'));
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'p24-ed-')), 'worker.mjs');
// esbuild is not a dependency of the site: npx fetches it (cached after the first run)
execFileSync('npx', ['-y', 'esbuild', JSON.stringify(path.join(root, 'app/tools/pdf-tools/pdf-editor/pdfEditor.worker.js')), '--bundle', '--format=esm', '--platform=neutral', '--main-fields=module,main', `--outfile=${JSON.stringify(out)}`, '--log-level=error'], { shell: true, cwd: root });
const { PDFDocument, StandardFonts } = require('pdf-lib');
const msgs = [];
globalThis.self = { postMessage: (m) => msgs.push(m) };
await import(pathToFileURL(out).href);
const handler = self.onmessage, sink = self;
const run = async (data) => { msgs.length = 0; globalThis.self = sink; await handler({ data }); for (let i = 0; i < 50 && !msgs.some((m) => ['done', 'error', 'limit'].includes(m.type)); i++) await new Promise((r) => setTimeout(r, 100)); return msgs.find((m) => ['done', 'error', 'limit'].includes(m.type)); };
const src = await PDFDocument.create(); src.addPage([300, 300]).drawText('Original', { x: 20, y: 250, size: 14, font: await src.embedFont(StandardFonts.TimesRoman) });
const file = new Blob([await src.save()]);
const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'), (c) => c.charCodeAt(0));
const pageOrder = [{ originalIndex: 0, rotationDelta: 0 }];
const done = await run({ file, pageOrder, mode: 'edit', maxPages: 100, overlays: [{ type: 'text', pageIndex: 0, text: 'Added Hello', x: 20, y: 100, fontSize: 18, color: [0, 0, 0] }, { type: 'image', id: 'i1', pageIndex: 0, x: 100, y: 150, width: 40, height: 40, bytes: png, format: 'png' }] });
const pdfjs = await import(pathToFileURL(path.join(root, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const doc = await pdfjs.getDocument({ data: new Uint8Array(await done.blob.arrayBuffer()) }).promise; const page = await doc.getPage(1);
const text = (await page.getTextContent()).items.map((i) => i.str).join(' ');
const imgs = (await page.getOperatorList()).fnArray.filter((f) => f === pdfjs.OPS.paintImageXObject).length;
const cyr = await run({ file, pageOrder, mode: 'edit', maxPages: 100, overlays: [{ type: 'text', pageIndex: 0, text: 'Привет', x: 20, y: 100, fontSize: 18, color: [0, 0, 0] }] });
const ok1 = /Added Hello/.test(text) && imgs === 1, ok2 = cyr?.type === 'error' && /cannot write/.test(cyr.message);
console.log(ok1 ? 'PASS' : 'FAIL', 'added text and image present in the saved PDF (pdf.js)', JSON.stringify(text), imgs);
console.log(ok2 ? 'PASS' : 'FAIL', 'non-Latin text refused with a sentence', cyr?.message?.slice(0, 80));
console.log(ok1 && ok2 ? 'pdf-editor-worker: all passed' : 'pdf-editor-worker: FAILED');
process.exitCode = ok1 && ok2 ? 0 : 1;
