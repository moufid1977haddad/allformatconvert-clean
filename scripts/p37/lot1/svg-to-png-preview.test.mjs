// P37 lot 1, bug 2 -- SVG to PNG: the preview under "Convert to PNG" showed a broken picture.
// The page keeps resultOf()'s object { blob, url, name } in `result`; the preview <img> must use result.url.
// React turns an object given to src into the text "[object Object]", which is no picture.
// This test reads the preview <img> of svg-to-png/page.jsx and evaluates its src the way React does, with the
// object resultOf() really returns (app/lib/imageOutput.js). Browser proof: svg-to-png-preview.pw.mjs.
//   node scripts/p37/lot1/svg-to-png-preview.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import './ext-hook.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
globalThis.URL.createObjectURL = () => 'blob:http://localhost/1234';
const { resultOf } = await import(pathToFileURL(path.join(ROOT, 'app/lib/imageOutput.js')).href);
const page = fs.readFileSync(path.join(ROOT, 'app/tools/image-tools/svg-to-png/page.jsx'), 'utf8');
const m = /<img alt="Preview of your image" src=\{([^}]+)\}/.exec(page);
if (!m) { console.log('FAIL  no preview <img> found'); process.exit(1); }
const result = resultOf(new Blob([new Uint8Array(8)], { type: 'image/png' }), 'logo.svg', '');
const src = String(new Function('result', `return (${m[1]});`)(result)); // React stringifies a non-string src
const ok = /^blob:|^data:image\//.test(src);
console.log(`preview src expression: {${m[1]}} -> "${src}"`);
console.log(`${ok ? 'PASS' : 'FAIL'}  the preview points to the PNG`);
process.exitCode = ok ? 0 : 1;
