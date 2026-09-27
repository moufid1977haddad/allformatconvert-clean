// Zip Extractor's "Download all as ZIP" ABOVE the 1.9 GB that one in-memory ZIP can hold, in a browser without
// showSaveFilePicker (Firefox; WebKit tried too): the ZIP must now be streamed to the downloads by the service worker
// at /zipdl/sw.js instead of being refused. The downloaded ZIP is reopened here by Windows' tar.exe (libarchive):
// every entry's bytes hashed against the source files. Also: an archive under the cap still takes the in-memory
// path (no service worker needed).
// Archive: made by the caller, e.g. two 1.1 GB files of zeros + a small text, zipped by tar.exe (a 2 MB .zip).
// Usage: node scripts/browser-tests/zip-extractor-stream-all.mjs <origin> <big.zip> <source dir> [--browser=webkit]
import { firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, zip, srcDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=webkit') ? webkit : firefox;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zipstream-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${engine.name()} ${n}`, info); };
const hashFile = (f) => new Promise((ok) => { const h = createHash('sha256'); fs.createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))); });

const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
check('no showSaveFilePicker here (the case being tested)', !(await p.evaluate(() => 'showSaveFilePicker' in window)));
await p.locator('input[type=file]').first().setInputFiles(zip);
await p.getByRole('button', { name: /Download all as ZIP/ }).waitFor({ timeout: 60000 });
const t0 = Date.now();
const dlP = p.waitForEvent('download', { timeout: 600000 }).catch(() => null);
await p.getByRole('button', { name: /Download all as ZIP/ }).click();
const d = await dlP;
if (!d) {
  check('a download starts', false, (await p.locator('[role=alert], .bg-red-50').allTextContents()).join(' ').slice(0, 300));
} else {
  console.log('suggested file name:', JSON.stringify(d.suggestedFilename()));
  const out = path.join(tmp, d.suggestedFilename() || 'unnamed-download');
  await d.saveAs(out); // resolves when the browser has finished writing it
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const size = fs.statSync(out).size;
  const status = await p.locator('body').innerText().then((t) => (t.match(/\d+ files? in [^\n]*/) || [''])[0]);
  check(`the ZIP is downloaded: ${d.suggestedFilename()}, ${(size / 1e9).toFixed(2)} GB in ${secs} s`, size > 2.2e9, status);
  const x = path.join(tmp, 'x'); fs.mkdirSync(x);
  let listed = '';
  try { execFileSync('C:\\Windows\\System32\\tar.exe', ['-xf', out, '-C', x]); listed = fs.readdirSync(x).join(','); } catch (e) { listed = 'tar failed: ' + String(e.message).slice(0, 200); }
  for (const f of fs.readdirSync(srcDir)) {
    const got = path.join(x, f);
    check(`${f}: bytes identical to the source`, fs.existsSync(got) && (await hashFile(got)) === (await hashFile(path.join(srcDir, f))), listed);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
await b.close();
console.log(fails ? `${fails} FAILED (${engine.name()})` : `all passed (${engine.name()})`);
process.exit(fails ? 1 : 0);
