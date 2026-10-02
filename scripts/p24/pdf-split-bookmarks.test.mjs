// P24 (03/10): PDF Split "By bookmarks" (Sejda, PDF24) — the worker reads the bookmarks (explicit, named in the /Names
// tree, GoTo action, page number; a web link is skipped), splitPlan cuts at them, the parts are read back by pdf.js.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../..');
const require = createRequire(path.join(root, 'package.json'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-bm-'));
const out = path.join(tmp, 'worker.mjs');
execFileSync('npx', ['-y', 'esbuild', JSON.stringify(path.join(root, 'app/tools/pdf-tools/pdf-split/pdfSplit.worker.js')), '--bundle', '--format=esm', '--platform=neutral', '--main-fields=module,main', `--outfile=${JSON.stringify(out)}`, '--log-level=error'], { shell: true });
const { planSplit, partName } = await import(pathToFileURL(path.join(root, 'app/tools/pdf-tools/pdf-split/splitPlan.js')).href);
const { PDFDocument, PDFName, PDFHexString, PDFString, PDFNumber } = require('pdf-lib');
const msgs = [];
globalThis.self = { postMessage: (m) => msgs.push(m) };
await import(pathToFileURL(out).href);
const handler = self.onmessage, sink = self;
const run = async (data, want) => { msgs.length = 0; globalThis.self = sink; await handler({ data }); for (let i = 0; i < 80 && !msgs.some((m) => [want, 'error', 'limit'].includes(m.type)); i++) await new Promise((r) => setTimeout(r, 50)); return msgs.find((m) => m.type === want) || msgs.find((m) => m.type === 'error'); };
let fails = 0;
const check = (name, ok, detail = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// 8 pages; outline: Introduction (p2, explicit) · Chapter A (p3) > A.1 (p4, explicit), A.2 (p5, named in /Names)
// · Website (URI: no page) · Chapter B (p6, GoTo action) · Chapter C (p8, page number)
const doc = await PDFDocument.create();
for (let i = 0; i < 8; i++) doc.addPage([300, 300]);
const ctx = doc.context, P = doc.getPages();
const item = (title, extra) => ctx.obj({ Title: PDFHexString.fromText(title), ...extra });
const intro = item('Introduction', { Dest: [P[1].ref, PDFName.of('Fit')] });
const chA = item('Chapter A', { Dest: [P[2].ref, PDFName.of('XYZ'), null, null, null] });
const a1 = item('A.1 Scope', { Dest: [P[3].ref, PDFName.of('Fit')] });
const a2 = item('A.2 Method', { Dest: PDFString.of('sec-a2') });
const web = item('Website', { A: ctx.obj({ S: PDFName.of('URI'), URI: PDFString.of('https://example.com') }) });
const chB = item('Chapter B', { A: ctx.obj({ S: PDFName.of('GoTo'), D: [P[5].ref, PDFName.of('Fit')] }) });
const chC = item('Chapter C: results / notes', { Dest: [PDFNumber.of(7), PDFName.of('Fit')] });
const top = [intro, chA, web, chB, chC].map((d) => [d, ctx.register(d)]);
const kids = [a1, a2].map((d) => [d, ctx.register(d)]);
const rootRef = ctx.register(ctx.obj({ Type: 'Outlines', First: top[0][1], Last: top[4][1], Count: 5 }));
const link = (list, parent) => list.forEach(([d], i) => { d.set(PDFName.of('Parent'), parent); if (i) d.set(PDFName.of('Prev'), list[i - 1][1]); if (i < list.length - 1) d.set(PDFName.of('Next'), list[i + 1][1]); });
link(top, rootRef); link(kids, top[1][1]);
chA.set(PDFName.of('First'), kids[0][1]); chA.set(PDFName.of('Last'), kids[1][1]); chA.set(PDFName.of('Count'), PDFNumber.of(2));
doc.catalog.set(PDFName.of('Outlines'), rootRef);
doc.catalog.set(PDFName.of('Names'), ctx.obj({ Dests: ctx.obj({ Names: [PDFString.of('sec-a2'), ctx.obj([P[4].ref, PDFName.of('Fit')])] }) }));
const file = new File([await doc.save()], 'book.pdf');

const loaded = await run({ type: 'load', file, maxPages: 1000 }, 'loaded');
const bm = loaded?.bookmarks || [];
check('the worker reads 6 bookmarks with their pages (the web link has no page)', JSON.stringify(bm.map((b) => [b.title, b.page, b.depth])) === JSON.stringify([['Introduction', 1, 1], ['Chapter A', 2, 1], ['A.1 Scope', 3, 2], ['A.2 Method', 4, 2], ['Chapter B', 5, 1], ['Chapter C: results / notes', 7, 1]]), JSON.stringify(bm));
const plan1 = planSplit({ mode: 'bookmarks', bookmarks: bm, level: 1 }, 8);
const spans = (pl) => pl.files.map((f) => `${f.label}:${f.pages[0] + 1}-${f.pages[f.pages.length - 1] + 1}`).join(' | ');
check('top level: page 1 alone (before the first bookmark), then one file per chapter to the next', spans(plan1) === '0 (before the first bookmark):1-1 | 1 Introduction:2-2 | 2 Chapter A:3-5 | 3 Chapter B:6-7 | 4 Chapter C: results / notes:8-8', spans(plan1));
const plan2 = planSplit({ mode: 'bookmarks', bookmarks: bm, level: 2 }, 8);
check('two levels: sections cut Chapter A further', spans(plan2) === '0 (before the first bookmark):1-1 | 1 Introduction:2-2 | 2 Chapter A:3-3 | 3 A.1 Scope:4-4 | 4 A.2 Method:5-5 | 5 Chapter B:6-7 | 6 Chapter C: results / notes:8-8', spans(plan2));
check('no bookmarks: said, nothing made', /no bookmarks/.test(planSplit({ mode: 'bookmarks', bookmarks: [], level: 1 }, 8).error || ''));
check('one bookmark on page 1: said (same document)', /same document/.test(planSplit({ mode: 'bookmarks', bookmarks: [{ title: 'All', page: 0, depth: 1 }], level: 1 }, 8).error || ''));
const done = await run({ type: 'split', files: plan1.files, originalName: 'book.pdf' }, 'done');
const pages = done?.results?.map((r) => r.pages).join(',');
const names = done?.results?.map((r) => r.name) || [];
const total = done?.results?.reduce((n, r) => n + r.pages, 0);
check('the parts hold 1+1+3+2+1 = 8 pages, every page once', pages === '1,1,3,2,1' && total === 8, pages);
check('file names come from the titles, made safe ("/" and ":" replaced)', names[4] === partName('book.pdf', plan1.files[4].label) && !/[\\/:]/.test(names[4].replace(/^book_/, '')), names.join(' · '));
const pdfjs = await import(pathToFileURL(path.join(root, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const chapterA = await pdfjs.getDocument({ data: new Uint8Array(await done.results[2].blob.arrayBuffer()) }).promise;
const outlineA = (await chapterA.getOutline() || []).map((o) => o.title + (o.items?.length ? '>' + o.items.map((x) => x.title).join('+') : '')).join(',');
check('the Chapter A part keeps its own bookmarks (Chapter A > A.1, A.2) and the web link, read by pdf.js', outlineA === 'Chapter A>A.1 Scope+A.2 Method,Website', outlineA); // a web-link bookmark has no page: kept in every part
{ // review (03/10): a named destination in the old catalog /Dests whose name holds a space (/sec#20two) was missed
  const d2 = await PDFDocument.create();
  for (let i = 0; i < 3; i++) d2.addPage([200, 200]);
  const c2 = d2.context, Q = d2.getPages();
  const one = c2.obj({ Title: PDFHexString.fromText('One'), Dest: [Q[0].ref, PDFName.of('Fit')] });
  const two = c2.obj({ Title: PDFHexString.fromText('Two'), Dest: PDFName.of('sec two') });
  const r1 = c2.register(one), r2 = c2.register(two);
  const root2 = c2.register(c2.obj({ Type: 'Outlines', First: r1, Last: r2, Count: 2 }));
  one.set(PDFName.of('Parent'), root2); one.set(PDFName.of('Next'), r2); two.set(PDFName.of('Parent'), root2); two.set(PDFName.of('Prev'), r1);
  d2.catalog.set(PDFName.of('Outlines'), root2);
  const dests = c2.obj({}); dests.set(PDFName.of('sec two'), c2.obj([Q[2].ref, PDFName.of('Fit')])); d2.catalog.set(PDFName.of('Dests'), dests);
  const l2 = await run({ type: 'load', file: new File([await d2.save()], 'named.pdf'), maxPages: 1000 }, 'loaded');
  const got = (l2?.bookmarks || []).map((b) => `${b.title}@${b.page + 1}`).join(',');
  check('a named destination with a space in the old /Dests catalog is found', got === 'One@1,Two@3', got);
}
console.log(fails ? `pdf-split-bookmarks: ${fails} FAILED` : 'pdf-split-bookmarks: all passed');
process.exitCode = fails ? 1 : 0;
