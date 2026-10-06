// P37 review n° 5: Arabic PDFs printed by Chromium (Playwright page.pdf, as Chrome "Save as PDF" and our Gotenberg).
// One PDF page per argument; inside a page, "/" is a forced line break (<br>), "//" a new paragraph.
//   node scripts/p37/review/make-chrome-arabic.mjs <name> <font> "<page 1>" "<page 2>" → %TEMP%\p37-review-redact\ar5\<name>.pdf
import { chromium } from '@playwright/test';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [name, font, ...pages] = process.argv.slice(2);
const DIR = path.join(os.tmpdir(), 'p37-review-redact', 'ar5');
fs.mkdirSync(DIR, { recursive: true });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = pages.map((pg, n) => `<div style="${n ? 'break-before:page;' : ''}">${pg.split('//').map((para) => `<p style="margin:0 0 10px">${para.split('/').map(esc).join('<br>')}</p>`).join('')}</div>`).join('');
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><body style="font-family:'${font}';font-size:16pt;line-height:1.9;margin:60px">${html}</body></html>`);
const file = path.join(DIR, `${name}.pdf`);
await p.pdf({ path: file, format: 'A4' });
await b.close();
console.log(file);
