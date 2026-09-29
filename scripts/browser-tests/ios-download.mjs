// The iPhone download path (app/lib/download.js + app/components/IosDownloadBridge.jsx) forced in any engine:
// a Download link (data: or blob:) must reach the browser's downloads as a response with Content-Disposition
// attachment, from /zipdl/<id>/<name>, under the right name, bytes intact. Real iOS Safari still to confirm.
// Usage: node scripts/browser-tests/ios-download.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const eng = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const b = await eng.launch(); const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addInitScript(() => { window.__forceAttachmentDownload = true; });
const page = await ctx.newPage();
const seen = []; page.on('request', (r) => { if (r.url().includes('/zipdl/')) seen.push(r.url()); });
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const jpg = 'docs/audit/fixtures-safari/safari-small-800x600.jpg';
async function run(label, path, pick, go, btnSel, expect) {
  await page.goto(origin + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // bridge + worker registered
  seen.length = 0;
  await page.locator('input[type=file]').first().setInputFiles(pick);
  await go();
  const btn = typeof btnSel === 'string' ? page.locator(btnSel).first() : btnSel;
  await btn.waitFor({ timeout: 60000 });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), btn.click()]);
  const buf = fs.readFileSync(await dl.path());
  check(label, seen.some((u) => u.includes('/zipdl/')) && expect(dl.suggestedFilename(), buf), `${dl.suggestedFilename()} ${buf.length} B via ${seen[0] ? '/zipdl/' : 'blob link'}`);
}
await run('JPG to PNG (data: link)', '/tools/image-tools/jpg-to-png', jpg, () => page.getByRole('button', { name: /Convert/ }).first().click(), page.getByRole('link', { name: /Download/ }),
  (n, buf) => /\.png$/.test(n) && buf[0] === 0x89 && buf[1] === 0x50);
await run('JPG to PDF (blob: link)', '/tools/pdf-tools/jpg-to-pdf', jpg, () => page.getByRole('button', { name: /Convert|Create PDF/ }).first().click(), page.getByRole('link', { name: /Download PDF/ }),
  (n, buf) => /\.pdf$/.test(n) && buf.slice(0, 5).toString() === '%PDF-');
if (eng !== webkit) await run('Image Converter (detached link clicked from code, blob revoked at once)', '/tools/image-tools/image-converter', jpg, async () => { await page.locator('select').filter({ has: page.locator('option[value="ico"]') }).selectOption('png'); await page.getByRole('button', { name: /^Convert \d+ file/ }).click(); }, page.locator('div.bg-green-50 button', { hasText: 'Download' }),
  (n, buf) => /\.png$/.test(n) && buf[0] === 0x89);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${eng.name()})`); process.exit(fails ? 1 : 0);
