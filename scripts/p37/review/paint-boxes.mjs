// P37 review: paints the page's black boxes (Node replay, scripts/p35/harness.mjs) on a copy of the ORIGINAL page and
// draws it with Poppler, to look at what stays visible. node scripts/p37/review/paint-boxes.mjs <pdf> <term> <out.png> [x y w h at 288 dpi]
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const lib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdf-lib/cjs/index.js')).href).then((m) => m.default || m);
const { redact } = await import(pathToFileURL(path.join(ROOT, 'scripts/p35/harness.mjs')).href);
const [pdf, term, png, ...crop] = process.argv.slice(2);
const r = await redact(pdf, term.split('|'));
const d = await lib.PDFDocument.load(fs.readFileSync(pdf));
const pg = d.getPage(0);
let ops = 'Q q 0 g';
for (const q of r.quads[1]) ops += ` ${q[0][0]} ${q[0][1]} m ${q.slice(1).map(([x, y]) => `${x} ${y} l`).join(' ')} h f`;
ops += ' Q';
const s = d.context.register(d.context.stream(ops));
const c = pg.node.get(lib.PDFName.of('Contents'));
const pre = d.context.register(d.context.stream('q'));
pg.node.set(lib.PDFName.of('Contents'), d.context.obj([pre, ...(c instanceof lib.PDFArray ? c.asArray() : [c]), s]));
const tmp = png.replace(/\.png$/, '.pdf'); fs.writeFileSync(tmp, await d.save());
const a = ['-r', '288', '-png', '-singlefile']; if (crop.length) a.push('-x', crop[0], '-y', crop[1], '-W', crop[2], '-H', crop[3]);
execFileSync('pdftoppm', [...a, tmp, png.replace(/\.png$/, '')]);
console.log('quads', JSON.stringify(r.quads[1].map((q) => q.map((p) => p.map((v) => +v.toFixed(1))))));
