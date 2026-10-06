// P37 review n° 2: what canvasInk (app/lib/pdfRedact.js) returns when the face PDF.js names is not usable by the
// canvas (PDF.js sets font.disableFontFace when the browser rejects the font and then draws the glyph as a path):
// the measure falls back to the fallback family. Runs canvasInk's own source in an empty page (no server).
//   node scripts/p37/review/canvas-ink-fallback.mjs [--browser=chromium|webkit]
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const engine = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const src = fs.readFileSync(path.join(ROOT, 'app/lib/pdfRedact.js'), 'utf8');
const start = src.indexOf('export function canvasInk(ctx)');
let depth = 0, end = start;
for (let i = src.indexOf('{', start); i < src.length; i++) { if (src[i] === '{') depth++; if (src[i] === '}') { depth--; if (!depth) { end = i + 1; break; } } }
const fn = src.slice(start, end).replace('export ', '');
const b = await { chromium, webkit }[engine].launch();
const p = await b.newPage();
const out = await p.evaluate((code) => {
  // eslint-disable-next-line no-new-func
  const canvasInk = new Function(`${code}; return canvasInk;`)();
  const c = document.createElement('canvas'); c.width = 400; c.height = 400;
  const ink = canvasInk(c.getContext('2d', { willReadFrequently: true }));
  return {
    // a face that is not loaded (PDF.js disableFontFace) and a private-use code, as PDF.js remaps glyphs
    notLoadedPUA: ink({ loadedName: 'g_d0_f9', fallbackName: 'serif' }, ''),
    notLoadedLatinItalic: ink({ loadedName: 'g_d0_f9', fallbackName: 'sans-serif', italic: true }, 'f'),
    systemHelvetica: ink({ systemFontInfo: { css: 'Helvetica, sans-serif' } }, 'p'),
  };
}, fn);
console.log(engine, JSON.stringify(out));
await b.close();
