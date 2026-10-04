// P31 (03/10): every output format the site proposes has the right type and extension (an iPhone saved an M4R as
// "….m4r.html"). Reads every format list of the tools and checks it against app/lib/mimeTypes.js; checks that the
// audio output guard refuses an HTML page or empty bytes named as audio. Usage: node scripts/p31/output-formats.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MIME_BY_EXT, mimeForName } from '../../app/lib/mimeTypes.js';
import { AUDIO_OUTPUT_FORMATS, AUDIO_OUTPUT_MAGIC, audioOutputProblem, buildOutputSpec } from '../../app/lib/audioFormats.js';
import { MERGE_FORMATS } from '../../app/lib/audioMerge.js';
import { derivedName } from '../../app/lib/download.js';

let n = 0;
const same = (label, ext, mime) => {
  n++;
  assert.ok(MIME_BY_EXT[ext], `${label}: extension .${ext} missing from app/lib/mimeTypes.js`);
  assert.equal(mime, MIME_BY_EXT[ext], `${label}: .${ext} typed ${mime}, expected ${MIME_BY_EXT[ext]}`);
};
for (const f of AUDIO_OUTPUT_FORMATS) {
  same(`audio ${f.value}`, f.ext, f.mime);
  assert.ok(AUDIO_OUTPUT_MAGIC[f.value], `audio ${f.value}: no first-bytes check`);
  const spec = buildOutputSpec(f.value, 192);
  assert.equal(spec.ext, f.ext, `audio ${f.value}: buildOutputSpec ext`);
  assert.equal(spec.mime, f.mime, `audio ${f.value}: buildOutputSpec mime`);
}
for (const f of MERGE_FORMATS) same(`audio merge ${f.value}`, f.ext, f.mime);
// Lists inside JSX components: read from the source.
const rows = (file, re) => [...fs.readFileSync(file, 'utf8').matchAll(re)].map((m) => m.groups);
for (const g of rows('app/components/PdfToImages.jsx', /\{ value: '(?<v>\w+)', label: '[^']*', mime: '(?<mime>[^']+)', ext: '(?<ext>\w+)' \}/g)) same(`PDF to images ${g.v}`, g.ext, g.mime);
const bar = rows('app/tools/qr-barcodes-tools/barcode-generator/page.jsx', /\{ id: '(?<ext>\w+)', label: '[^']*', mime: '(?<mime>[^']+)' \}/g);
assert.ok(bar.length >= 6, 'barcode formats read');
for (const g of bar) same(`barcode ${g.ext}`, g.ext, g.mime);
const imgExt = /const EXT = (\{[^}]+\})/.exec(fs.readFileSync('app/lib/imageOutput.js', 'utf8'))[1];
for (const [mime, ext] of Object.entries(JSON.parse(imgExt.replace(/'/g, '"')))) same(`image output ${ext}`, ext, mime);
const extra = /EXTRA_FORMATS = \[([^\]]+)\]/.exec(fs.readFileSync('app/tools/image-tools/image-converter/extraFormats.js', 'utf8'))[1].match(/\w+/g);
for (const e of extra) { n++; assert.ok(MIME_BY_EXT[e], `image converter .${e} missing from mimeTypes`); }

// The guard: real first bytes pass, an HTML page or empty bytes named as audio are refused.
const html = new TextEncoder().encode('<!DOCTYPE html><html><head><title>404</title>');
const ftyp = Uint8Array.from([0, 0, 0, 0x20, ...new TextEncoder().encode('ftypM4A '), 0, 0, 0, 0]);
assert.equal(audioOutputProblem('m4r', ftyp), null);
assert.match(audioOutputProblem('m4r', html), /not a real M4R/);
assert.match(audioOutputProblem('mp3', new Uint8Array(0)), /empty/);
for (const f of AUDIO_OUTPUT_FORMATS) { n++; assert.ok(audioOutputProblem(f.value, html), `audio ${f.value}: an HTML page must be refused`); }
assert.equal(mimeForName('memo-vocal.m4r'), 'audio/mp4');
assert.equal(mimeForName('Rapport été.PDF'), 'application/pdf');
assert.equal(mimeForName('no-extension'), null);
// The saved name keeps the visitor's own, without its old extension (a bash heredoc once turned \\ into \ in this
// regex: "sample.png" became "sample.png.jpg" — caught by scripts/p31/download-names.mjs, 03/10).
assert.equal(derivedName('sample.png', '', 'jpg'), 'sample.jpg');
assert.equal(derivedName('IMG_2433.HEIC', 'grayscale', 'png'), 'IMG_2433-grayscale.png');
assert.equal(derivedName('dossier\\a:b.jpg', 'x', 'png'), 'dossier_a_b-x.png');
assert.equal(derivedName('Été à Montréal 🎉.webp', 'no-background', 'png'), 'Été à Montréal 🎉-no-background.png');
assert.equal(derivedName('', '', 'png'), 'image.png');
console.log(`output-formats: ${n} checks, ALL PASS`);
