// P26: capture the HTML our EPUB to PDF and MOBI to PDF pages build in the browser and upload, so that
// gotenberg-probe.mjs can send Gotenberg exactly what the pages send. The upload is intercepted: nothing leaves.
//   node scripts/p26/capture-book-html.mjs <origin> <books-dir>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [origin, dir] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
for (const kind of ['epub', 'mobi']) {
  const p = await ctx.newPage();
  let got = null;
  await p.route('**/api/convert-html-to-pdf', async (route) => {
    const body = route.request().postDataBuffer();
    const s = body.toString('latin1');
    const start = s.indexOf('\r\n\r\n') + 4;
    const end = s.lastIndexOf('\r\n--');
    got = body.subarray(start, end);
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"captured"}' });
  });
  await p.goto(`${origin}/tools/pdf-tools/${kind}-to-pdf`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(path.resolve(`scripts/audit/fixtures/files/sample.${kind}`));
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  for (let i = 0; i < 60 && !got; i++) await p.waitForTimeout(500);
  if (!got) { console.log(`FAIL ${kind}: no upload seen`); continue; }
  fs.writeFileSync(path.join(dir, `${kind}.html`), got);
  console.log(`captured ${kind}.html ${got.length} bytes, starts ${JSON.stringify(got.subarray(0, 40).toString())}`);
  await p.close();
}
await b.close();
