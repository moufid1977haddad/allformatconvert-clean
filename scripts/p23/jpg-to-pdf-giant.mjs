// P23: what JPG to PDF / Image to PDF make of a 30 000 × 30 000 PNG (900 MP) in each engine: page size, image size.
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
const [origin, file, eng = 'firefox', slug = 'pdf-tools/jpg-to-pdf'] = process.argv.slice(2);
const b = await { chromium, firefox, webkit }[eng].launch(); const p = await b.newPage();
await p.goto(`${origin}/tools/${slug}`); await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(file);
await p.getByRole('button', { name: /convert|create/i }).first().click();
const r = await Promise.race([p.locator('[data-file-download]').first().waitFor({ timeout: 240000 }).then(() => 'ok'), p.locator('[role=alert], .text-red-500, .text-red-600').filter({ hasText: /./ }).first().waitFor({ timeout: 240000 }).then(() => 'msg')]).catch(() => 'timeout');
if (r !== 'ok') { console.log(eng, slug, r, (await p.locator('main').innerText()).match(/[^\n]*(could|cannot|too|large|limit|read)[^\n]*/i)?.[0]); await b.close(); process.exit(0); }
const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => { const u = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); });
const buf = Buffer.from(b64, 'base64');
const d = await PDFDocument.load(buf); const pg = d.getPage(0); const { width, height } = pg.getSize();
let img = null; d.context.enumerateIndirectObjects().forEach(([, o]) => { if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) img = `${o.dict.get(PDFName.of('Width'))}x${o.dict.get(PDFName.of('Height'))}`; });
console.log(eng, slug, `PDF ${(buf.length / 1e6).toFixed(1)} MB, page ${width}x${height} pt, image ${img}`);
await b.close();
