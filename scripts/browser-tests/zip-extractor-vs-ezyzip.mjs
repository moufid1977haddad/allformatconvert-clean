// Same archive, same browser, our ZIP Extractor against ezyZip (the reference: 7-Zip WASM, zip.js, and since
// 22/09/2026 a streaming RAR engine, rar-stream.wasm). Both list first and extract on demand.
//   first: time from choosing the archive to holding <file inside> on disk (its own download), SHA-256 checked.
//   all:   time from choosing the archive to every file written into a folder: our "Save all to a folder",
//          ezyZip's "Save All". The folder picker is answered with a real folder on disk (a sub-folder of the
//          origin's private file system, OPFS), the same for both; every file's SHA-256 is then checked in the page.
// Usage: node scripts/browser-tests/zip-extractor-vs-ezyzip.mjs <our origin or _vercel_share URL> <file inside> <source dir> <archive parts...>
//   [--mode=first|all] [--password=...] [--browser=firefox] [--ours-only | --theirs-only]
//   <source dir> holds the archived files under the same relative paths (their SHA-256 is the reference).
import { chromium, firefox } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const [entry, inner, srcDir, ...parts] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const engine = flags.browser === 'firefox' ? firefox : chromium;
const mode = flags.mode || 'first';
const sha = (f) => new Promise((ok) => { const h = createHash('sha256'); fs.createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))); });
const base = inner.split('/').pop();
const want = await sha(path.join(srcDir, inner));

// The folder picker answered with a fresh OPFS folder; after the run, the SHA-256 of every file written there.
const pickFolder = () => { window.showDirectoryPicker = async () => { const root = await navigator.storage.getDirectory(); const name = 'pick-' + Date.now(); window.__picked = name; return root.getDirectoryHandle(name, { create: true }); }; };
// Read back after the site is done with them (a file still being closed is NotReadableError): a few tries.
const folderHashes = async (page) => { for (let i = 0; ; i++) { try { return await folderHashesOnce(page); } catch (e) { if (i >= 5 || !/NotReadable/.test(e.message)) throw e; await page.waitForTimeout(2000); } } };
const folderHashesOnce = (page) => page.evaluate(async () => {
  const out = {};
  const walk = async (dir, rel) => { for await (const [n, h] of dir.entries()) { const p = rel ? `${rel}/${n}` : n; if (h.kind === 'directory') await walk(h, p); else { const f = await h.getFile(); const d = new Uint8Array(await crypto.subtle.digest('SHA-256', await f.arrayBuffer())); out[p] = [...d].map((x) => x.toString(16).padStart(2, '0')).join(''); } } };
  const root = await navigator.storage.getDirectory(); await walk(await root.getDirectoryHandle(window.__picked), '');
  return out;
});
const expected = () => { const o = {}; const walk = (d, rel) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n), q = rel ? `${rel}/${n}` : n; if (fs.statSync(p).isDirectory()) walk(p, q); else o[q] = p; } }; walk(srcDir, ''); return o; };
async function compare(got) {
  const exp = expected(); const bad = [];
  for (const [q, p] of Object.entries(exp)) if (got[q] !== await sha(p)) bad.push(q);
  for (const q of Object.keys(got)) if (!(q in exp)) bad.push(q);
  return bad.length ? `DIFFERS: ${bad.join(', ')}` : `${Object.keys(exp).length} files identical`;
}
// A persistent profile per site: a Playwright context is an off-the-record profile whose private file system lives
// in memory with a small quota, which made ezyZip's "Save All" fail on the second file (it stages in OPFS too).
const profiles = [];
async function newPage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zx-profile-')); profiles.push(dir);
  const ctx = await engine.launchPersistentContext(dir, { acceptDownloads: true });
  if (mode === 'all') await ctx.addInitScript(pickFolder);
  return ctx.pages()[0] || ctx.newPage();
}

async function ours() {
  const page = await newPage();
  if (entry.includes('_vercel_share')) await page.goto(entry);
  await page.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
  const t0 = Date.now();
  await page.locator('input[type=file]').setInputFiles(parts);
  if (flags.password) { await page.locator('#archive-password').waitFor({ timeout: 600000 }); await page.locator('#archive-password').fill(flags.password); await page.getByRole('button', { name: 'Unlock' }).click(); }
  let r;
  if (mode === 'first') {
    const btn = page.locator(`[data-entry="${inner}"] [data-download]`);
    await btn.waitFor({ timeout: 600000 });
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 1800000 }), btn.click()]);
    const f = await dl.path(); const secs = (Date.now() - t0) / 1000;
    r = { secs, info: (await sha(f)) === want ? 'content identical' : 'CONTENT DIFFERS' }; // before closing: the context deletes its downloads
  } else {
    await page.getByRole('button', { name: 'Save all to a folder' }).click({ timeout: 600000 });
    await page.locator('[data-status]').filter({ hasText: 'saved to the folder' }).waitFor({ timeout: 1800000 });
    const secs = (Date.now() - t0) / 1000;
    r = { secs, info: await compare(await folderHashes(page)) };
  }
  await page.context().close();
  return r;
}
async function theirs() {
  const page = await newPage();
  await page.goto('https://www.ezyzip.com/open-extract-rar-file-online.html', { waitUntil: 'load' });
  const t0 = Date.now();
  await page.locator('input[type=file]').first().setInputFiles(parts);
  if (flags.password) { const pw = page.locator('input[type=password]').first(); await pw.waitFor({ timeout: 600000 }); await pw.fill(flags.password); await pw.press('Enter'); }
  let r;
  if (mode === 'first') {
    // open the folders down to the file, then its "More save options" > "Download <name>" (a plain download;
    // "Save" may open the system's save dialog instead)
    for (const dir of inner.split('/').slice(0, -1)) await page.getByText(dir, { exact: true }).first().click({ timeout: 600000 });
    const row = page.locator(`tr[data-filename="${base}"]`);
    await row.waitFor({ timeout: 600000 });
    await row.getByRole('button', { name: 'More save options' }).click();
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 1800000 }), row.getByRole('menuitem', { name: `Download ${base}` }).click()]);
    const f = await dl.path(); const secs = (Date.now() - t0) / 1000;
    r = { secs, info: f && (await sha(f)) === want ? 'content identical' : 'CONTENT DIFFERS' };
  } else {
    await page.locator('tr[data-filename]').first().waitFor({ timeout: 600000 });
    await page.getByRole('button', { name: 'Save All file', exact: true }).click();
    const sizes = Object.fromEntries(Object.entries(expected()).map(([q, p]) => [q, fs.statSync(p).size]));
    // Polled from here (waitForFunction does not wait for an async predicate). ezyZip sizes its files up front, so a
    // full size is not the end; Chromium writes into "<name>.crswap" until the writable is closed: done when every
    // file has its size and no swap file is left.
    const done = () => page.evaluate(async (sizes) => {
      if (!window.__picked) return false;
      const got = {};
      const walk = async (dir, rel) => { for await (const [n, h] of dir.entries()) { const p = rel ? `${rel}/${n}` : n; if (h.kind === 'directory') await walk(h, p); else got[p] = (await h.getFile()).size; } };
      try { await walk(await (await navigator.storage.getDirectory()).getDirectoryHandle(window.__picked), ''); } catch { return false; }
      return Object.entries(sizes).every(([p, s]) => got[p] === s) && !Object.keys(got).some((p) => p.endsWith('.crswap'));
    }, sizes);
    while (!(await done())) { if (Date.now() - t0 > 1800000) throw new Error('not finished after 30 min'); await page.waitForTimeout(250); }
    const secs = (Date.now() - t0) / 1000;
    r = { secs, info: await compare(await folderHashes(page)) };
  }
  await page.context().close();
  return r;
}
const fail = (e) => ({ secs: NaN, info: 'FAILED ' + e.message.split('\n')[0] });
if (!flags['theirs-only']) { const r = await ours().catch(fail); console.log('ours  ', engine.name(), mode, r.secs.toFixed(1), 's', r.info); }
if (!flags['ours-only']) { const r = await theirs().catch(fail); console.log('ezyZip', engine.name(), mode, r.secs.toFixed(1), 's', r.info); }
for (const d of profiles) try { fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 }); } catch { /* a browser file still locked: left in the temp folder */ }
