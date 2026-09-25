// Same archive, same browser: time from choosing the archive to holding one extracted file on disk, on our
// ZIP Extractor and on ezyZip (the reference: 7-Zip WASM + zip.js + libarchive.js), the file's SHA-256 checked
// against the source. ezyZip extracts a file when its "Save" is clicked; ours extracts everything first.
// Usage: node scripts/browser-tests/zip-extractor-vs-ezyzip.mjs <our origin or _vercel_share URL> <file inside> <source copy of it> <archive parts...>
//   [--password=...] [--browser=firefox] [--ours-only | --theirs-only]
import { chromium, firefox } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const [entry, inner, source, ...parts] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const engine = flags.browser === 'firefox' ? firefox : chromium;
const want = createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sha = (f) => new Promise((ok) => { const h = createHash('sha256'); fs.createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))); });
const b = await engine.launch();
const base = inner.split('/').pop();

async function ours() {
  const page = await (await b.newContext({ acceptDownloads: true })).newPage();
  if (entry.includes('_vercel_share')) await page.goto(entry);
  await page.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
  const t0 = Date.now();
  await page.locator('input[type=file]').setInputFiles(parts);
  if (flags.password) { await page.locator('#archive-password').waitFor({ timeout: 600000 }); await page.locator('#archive-password').fill(flags.password); await page.getByRole('button', { name: 'Unlock' }).click(); }
  await page.getByText(/files? extracted \(/).waitFor({ timeout: 1800000 });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 600000 }), page.locator(`[data-entry="${inner}"] a[download]`).click()]);
  const f = await dl.path(); const secs = (Date.now() - t0) / 1000;
  const ok = (await sha(f)) === want; // before closing: the context deletes its downloads
  await page.context().close();
  return { secs, ok };
}
async function theirs() {
  const page = await (await b.newContext({ acceptDownloads: true })).newPage();
  await page.goto('https://www.ezyzip.com/open-extract-rar-file-online.html', { waitUntil: 'load' });
  const t0 = Date.now();
  await page.locator('input[type=file]').first().setInputFiles(parts);
  if (flags.password) { const pw = page.locator('input[type=password]').first(); await pw.waitFor({ timeout: 600000 }); await pw.fill(flags.password); await pw.press('Enter'); }
  // open the folders down to the file, then its "Save"
  for (const dir of inner.split('/').slice(0, -1)) await page.getByText(dir, { exact: true }).first().click({ timeout: 600000 });
  // its file row (tr[data-filename]), "More save options", then "Download <name>" (a plain download; "Save" may
  // open the system's save dialog instead)
  const row = page.locator(`tr[data-filename="${base}"]`);
  await row.waitFor({ timeout: 600000 });
  await row.getByRole('button', { name: 'More save options' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 1800000 }), row.getByRole('menuitem', { name: `Download ${base}` }).click()]);
  const f = await dl.path(); const secs = (Date.now() - t0) / 1000;
  const ok = f ? (await sha(f)) === want : false;
  await page.context().close();
  return { secs, ok };
}
if (!flags['theirs-only']) { const r = await ours(); console.log('ours ', engine.name(), r.secs.toFixed(1), 's', r.ok ? 'content identical' : 'CONTENT DIFFERS'); }
if (!flags['ours-only']) { const r = await theirs().catch((e) => ({ secs: NaN, ok: false, err: e.message.split('\n')[0] })); console.log('ezyZip', engine.name(), r.secs.toFixed(1), 's', r.ok ? 'content identical' : `FAILED ${r.err || 'content differs'}`); }
await b.close();
