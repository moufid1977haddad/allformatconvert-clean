// P28: the PDF Repair PAGE with real damaged PDFs, as a visitor uses it: upload, repair, read what the page says
// (method, text check, warnings) and download the file. Chromium, one engine (light check).
//   node scripts/p28/repair-page.mjs <origin> <out-dir> <pdf>...
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [originArg, outDir, ...files] = process.argv.slice(2);
const origin = new URL(originArg).origin;
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await ctx.route(/vercel\.live/, (r) => r.abort());
let fails = 0;
for (const f of files) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-repair`, { waitUntil: 'load' });
  await p.locator('input[type=file]').first().setInputFiles(f);
  await p.getByRole('button', { name: 'Repair PDF' }).click();
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download]').first().waitFor({ timeout: 240000 }).then(() => 'ok'),
    p.locator('p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 240000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  const name = path.basename(f);
  if (r !== 'ok') {
    const msg = r === 'alert' ? await p.locator('p[role=alert]').first().innerText() : 'no result in 240 s';
    console.log(`REFUSED ${name}: ${msg.slice(0, 200)}`);
    await p.close(); continue;
  }
  const said = (await p.locator('text=/Repaired using/').first().innerText()).trim();
  const check = await p.locator('text=/Text checked|No PDF reader could open/').first().innerText().catch(() => '(no text-check line)');
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const u = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
  });
  const buf = Buffer.from(b64, 'base64');
  const ok = buf.subarray(0, 5).toString() === '%PDF-';
  if (!ok) fails++;
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${said} | ${check.trim()} | ${buf.length} bytes`);
  await p.close();
}
await b.close();
process.exit(fails ? 1 : 0);
