// End-to-end of the document tools against a DEPLOYED site and the DEPLOYED media service: real page,
// real file picker, real click, real download. Measures the total perceived time (click -> download
// event, upload included) and checks the downloaded bytes.
//
// Usage: node scripts/browser-tests/e2e-office-remote.mjs <entryUrl> <toolPath> <file> [engine]
//   entryUrl: site origin, or (preview) the share URL carrying ?_vercel_share=... (first navigation only,
//             never printed or stored)
//   toolPath: e.g. /tools/pdf-tools/word-to-pdf
//   env: EXPECT=pdf|docx (default pdf), OUT=<dir> to keep the downloaded file, EXPECT_ERROR=1 when a
//        refusal (message shown, nothing sent) is the expected outcome, LIMIT_S (default 900)
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [entry, toolPath, file, engineName = 'chromium'] = process.argv.slice(2);
const engine = { chromium, firefox, webkit }[engineName];
const origin = new URL(entry).origin;
const expect = process.env.EXPECT || 'pdf';
const browser = await engine.launch();
const ctx = await browser.newContext({ acceptDownloads: true });
if (new URL(entry).search) { const p = await ctx.newPage(); await p.goto(entry, { waitUntil: 'domcontentloaded' }); await p.close(); }

const page = await ctx.newPage();
const chunkPuts = []; const routeCalls = []; const errors = [];
page.on('request', (r) => {
  if (r.method() === 'PUT' && /\/chunks\/\d+$/.test(r.url())) chunkPuts.push(r.url());
  if (r.method() === 'POST' && r.url().startsWith(origin + '/api/') && !r.url().includes('/api/media/ticket')) routeCalls.push({ url: r.url(), type: r.headers()['content-type'], bytes: (r.postDataBuffer() || Buffer.alloc(0)).length });
});
const trace = []; let tStart = 0;
const label = (u) => u.replace(/[0-9a-f]{20,}/g, ':id').replace(/^https:\/\/[^/]+/, '');
page.on('requestfinished', async (r) => { if (tStart && !/_next|\.(js|css|png|ico|woff2?)$/.test(r.url())) { const t = r.timing(); trace.push(`${((Date.now() - tStart) / 1000).toFixed(1).padStart(5)}s end ${r.method()} ${label(r.url())} (${(t.responseEnd / 1000).toFixed(1)}s long)`); } });
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto(origin + toolPath, { waitUntil: 'networkidle' });
const body0 = await page.innerText('body');
const limitText = (body0.match(/Max [^\n]{0,60}/) || [''])[0];
await page.setInputFiles('input[type=file]', file);
const size = fs.statSync(file).size;
await page.waitForTimeout(400);

const btn = page.locator('button:has-text("Download PDF"), button:has-text("Download .docx"), button:has-text("Convert to PDF")').first();
const t0 = Date.now(); tStart = t0;
const dl = page.waitForEvent('download', { timeout: Number(process.env.LIMIT_S || 900) * 1000 }).catch(() => null);
const errSel = page.waitForSelector('p[role=alert]', { timeout: Number(process.env.LIMIT_S || 900) * 1000 }).catch(() => null);
if (await btn.isDisabled()) {
  console.log(`  REFUSED before sending (button disabled). Page text: "${limitText}"; message: "${(await page.$$eval('p[role=alert]', (e) => e.map((x) => x.textContent).join(' | ')))}"`);
  console.log(`  chunks sent: ${chunkPuts.length}, route calls: ${routeCalls.length}`);
  await browser.close();
  process.exit(process.env.EXPECT_ERROR ? 0 : 1);
}
await btn.click();
const first = await Promise.race([dl, errSel.then((x) => (x ? 'error' : null))]);
const total = (Date.now() - t0) / 1000;
let ok = false; let detail = '';
if (first && first !== 'error') {
  const buf = fs.readFileSync(await first.path());
  const name = first.suggestedFilename();
  if (process.env.OUT) await first.saveAs(path.join(process.env.OUT, engineName + '-' + name));
  const magic = expect === 'pdf' ? buf.subarray(0, 5).toString() === '%PDF-' : buf[0] === 0x50 && buf[1] === 0x4b;
  ok = magic && buf.length > 1000 && name.endsWith('.' + expect);
  detail = `${name}, ${(buf.length / 1048576).toFixed(2)} MB, magic ${magic ? 'ok' : 'BAD'}`;
} else {
  detail = 'page error: ' + (await page.$$eval('p[role=alert]', (e) => e.map((x) => x.textContent).join(' | ')));
}
const staged = chunkPuts.length > 0;
console.log(`  ${ok ? 'PASS' : (process.env.EXPECT_ERROR ? 'REFUSED' : 'FAIL')} ${path.basename(file)} (${(size / 1048576).toFixed(2)} MB) on ${toolPath} [${engineName}]: ${total.toFixed(1)} s total, ${detail}`);
console.log(`     path: ${staged ? 'STAGED (' + chunkPuts.length + ' chunk PUTs)' : 'direct multipart'}; site route calls: ${JSON.stringify(routeCalls.map((c) => ({ t: (c.type || '').split(';')[0], bytes: c.bytes })))}; pageerrors: ${errors.length}`);
if (process.env.TRACE) console.log(trace.join('\n'));
await browser.close();
process.exit(ok || process.env.EXPECT_ERROR ? 0 : 1);
