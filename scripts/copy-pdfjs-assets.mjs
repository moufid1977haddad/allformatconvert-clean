// P24 (03/10): the files PDF.js fetches at run time, served from /pdfjs/<version>/ (public/, not committed):
// - wasm/: the JPEG 2000, JBIG2 / CCITT fax and colour (qcms) decoders — without them PDF.js skipped such pictures and
//   a scanned page came out WHITE, with only a console warning (scripts/p24/pdfjs-decoders.mjs);
// - cmaps/: character maps of Chinese, Japanese and Korean PDFs whose fonts are not embedded (text read empty or wrong);
// - iccs/, standard_fonts/: colour profiles and the 14 standard fonts.
import fs from 'node:fs';
import path from 'node:path';
const src = path.join('node_modules', 'pdfjs-dist');
const version = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8')).version;
const dest = path.join('public', 'pdfjs', version);
const copyDir = (from, to, keep = () => true) => {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) if (keep(f) && fs.statSync(path.join(from, f)).isFile()) fs.copyFileSync(path.join(from, f), path.join(to, f));
};
copyDir(path.join(src, 'wasm'), path.join(dest, 'wasm'), (f) => !/^quickjs/.test(f)); // quickjs: PDF scripting, not used
copyDir(path.join(src, 'cmaps'), path.join(dest, 'cmaps'));
copyDir(path.join(src, 'iccs'), path.join(dest, 'iccs'));
copyDir(path.join(src, 'standard_fonts'), path.join(dest, 'standard_fonts'));
// older versions left by an upgrade are removed
for (const d of fs.readdirSync(path.join('public', 'pdfjs'))) if (d !== version) fs.rmSync(path.join('public', 'pdfjs', d), { recursive: true, force: true });
console.log(`pdfjs assets: public/pdfjs/${version}/ (wasm, cmaps, iccs, standard_fonts)`);
