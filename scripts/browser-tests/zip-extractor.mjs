// ZIP Extractor, real page, every archive built by archive-fixtures.mjs. The page lists first and extracts on
// demand; every file's bytes are taken from "Download all as ZIP", reopened here by JSZip (not the page's
// client-zip), and compared with the source files, with the CRCs WinRAR stored (node-unrar.js test suite), or
// with Windows' tar.exe (libarchive). Also: one file's own Download, passwords (wrong then right, at opening
// and at extraction time), split volumes (complete and incomplete), a non-archive, the ZIP streamed to disk
// (Chromium's showSaveFilePicker, stubbed to capture the bytes), and cancel.
// Usage: node scripts/browser-tests/zip-extractor.mjs <origin or _vercel_share URL> <fixtures dir> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, dir] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
// Default: no File System Access, so "Download all as ZIP" is a plain download we can reopen (Firefox's path).
await ctx.addInitScript(() => { if (!window.__keepPickers) { delete window.showSaveFilePicker; delete window.showDirectoryPicker; } });
const page = await ctx.newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const F = (n) => path.join(dir, n);
const TAR = 'C:\\Windows\\System32\\tar.exe';
const alertBox = () => page.locator('div.bg-red-50[role=alert]'); // not Next's empty route announcer, also role=alert

// The state the page settles in after an action. Read in ONE snapshot of the DOM (three racing waitFor() followed
// by separate reads could mix two states), only once the page has changed since the action (a MutationObserver
// armed just before it: the previous state is never taken for the new one), and only when nothing is running
// (no Cancel button). "Listed" means the status line of a finished listing, not any status line.
async function armed(action) {
  await page.evaluate(() => {
    window.__changed = false; window.__mo?.disconnect();
    window.__mo = new MutationObserver(() => { window.__changed = true; });
    // the tool only, not the navbar's animations
    window.__mo.observe(document.querySelector('input[type=file]').closest('.max-w-3xl'), { subtree: true, childList: true, characterData: true, attributes: true });
  });
  await action();
  const h = await page.waitForFunction(() => {
    if (!window.__changed) return null;
    if ([...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Cancel')) return null;
    const pw = document.querySelector('#archive-password');
    if (pw) return { password: document.querySelector('label[for=archive-password]').innerText };
    const al = document.querySelector('div.bg-red-50[role=alert]');
    if (al) return { error: al.innerText };
    const st = document.querySelector('[data-status]');
    if (st && /listed in/.test(st.innerText)) return { listed: [...document.querySelectorAll('[data-entry]')].map((e) => e.dataset.entry) };
    return null;
  }, null, { timeout: 120000, polling: 50 });
  return h.jsonValue();
}
async function open(names) {
  await page.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
  return armed(() => page.locator('input[type=file]').setInputFiles(names.map(F)));
}
async function unlock(pw) { await page.locator('#archive-password').fill(pw); return armed(() => page.getByRole('button', { name: 'Unlock' }).click()); }
// "Download all as ZIP", reopened by JSZip: { files: { path: Buffer } } -- or the password form if asked now
async function all(pw) {
  const dl = page.waitForEvent('download', { timeout: 300000 });
  await page.getByRole('button', { name: 'Download all as ZIP' }).click();
  const asked = await page.locator('#archive-password').waitFor({ timeout: 1500 }).then(() => true, () => false);
  let late = false;
  if (asked) { if (!pw) return { password: 'asked at extraction' }; await page.locator('#archive-password').fill(pw); await page.getByRole('button', { name: 'Unlock' }).click(); late = true; }
  const d = await dl;
  const zip = await JSZip.loadAsync(fs.readFileSync(await d.path()));
  const files = {};
  for (const [name, f] of Object.entries(zip.files)) if (!f.dir) files[name] = await f.async('nodebuffer');
  return { files, name: d.suggestedFilename(), askedLate: late };
}
async function opened(names, pw) {
  let r = await open(names);
  if (r.password && pw) r = await unlock(pw);
  return r.listed ? all(pw) : r;
}
const sameTree = (files, root) => {
  const want = {}; const walk = (d, rel) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n), q = rel ? `${rel}/${n}` : n; if (fs.statSync(p).isDirectory()) walk(p, q); else want[q] = sha(fs.readFileSync(p)); } }; walk(root, '');
  const got = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.replace(/^\.\//, ''), sha(v)]));
  const bad = Object.keys(want).filter((k) => got[k] !== want[k]).concat(Object.keys(got).filter((k) => !(k in want)));
  return { ok: bad.length === 0, info: bad.length ? `differs: ${bad.join(', ')} (got ${Object.keys(got).join(' | ')})` : `${Object.keys(want).length} files identical` };
};
const byTar = (archive) => { const out = fs.mkdtempSync(path.join(dir, 'ref-')); execFileSync(TAR, ['-xf', F(archive), '-C', out, '--exclude', '*symlink*']); return out; };
const show = (r) => (r.files ? Object.keys(r.files).join(' | ') : JSON.stringify(r));

// 1. tar.gz and zip made by Windows' tar.exe (accented names; the ZIP stores them in CP437 without the UTF-8 flag)
for (const a of ['tree.tar.gz', 'tree.zip']) { const r = await opened([a]); const t = r.files ? sameTree(r.files, F('tree')) : { ok: false, info: show(r) }; check(`${a} (made by tar.exe)`, t.ok, t.info); }
// 2. RAR made by WinRAR: Chinese folder names, sizes and CRC32 that WinRAR stored
{
  const r = await opened(['FolderTest.rar']);
  const want = { 'Folder1/Folder Space/long.txt': [1049076, 4138211950], 'Folder1/Folder 中文/2中文.txt': [15, 2631402331] };
  const ok = r.files && Object.entries(want).every(([p, [size, crc]]) => r.files[p]?.length === size && zlib.crc32(r.files[p]) === crc) && Object.keys(r.files).length === 2;
  check('FolderTest.rar (WinRAR, Chinese names): sizes and CRCs stored by WinRAR', ok, show(r));
}
// 3. RAR with encrypted headers: asks at opening, refuses a wrong password, then extracts
{
  let r = await open(['HeaderEnc1234.rar']);
  check('HeaderEnc1234.rar asks for a password', /password-protected/.test(r.password || ''), r.password || JSON.stringify(r));
  r = await unlock('12');
  check('wrong password refused and asked again', /Wrong password/.test(r.password || ''), r.password || JSON.stringify(r));
  r = await unlock('1234');
  const a = r.listed ? await all() : r;
  check('right password: both files, WinRAR CRCs match', a.files && zlib.crc32(a.files['1File.txt']) === 1468669977 && zlib.crc32(a.files['2中文.txt']) === 2631402331, show(a));
}
// 4. 7z with encrypted names, 7z with only the data encrypted (asked at extraction), AES-256 ZIP, ZipCrypto ZIP
const known = sha(fs.readFileSync(F('known-data.bin')));
for (const [a, pw] of [['aes-names.7z', 'P@ss wörd'], ['aes-data-only.7z', 'data-only'], ['aes256.zip', 'zip-aes'], ['zipcrypto.zip', 'zipcrypto']]) {
  const r = await opened([a], pw);
  const ok = r.files && r.files['secret.txt']?.toString() === 'top secret\n' && (/zipcrypto|data-only/.test(a) || sha(r.files['d/data.bin'] || Buffer.alloc(0)) === known);
  check(`${a} with its password${r.askedLate ? ' (asked at extraction)' : ''}`, ok && (a !== 'aes-data-only.7z' || r.askedLate), show(r));
}
// 5. split 7z: all parts, then a missing part
{
  let r = await opened(['split.7z.001', 'split.7z.002', 'split.7z.003']);
  check('split.7z.001-003 chosen together', r.files && sha(r.files['d/data.bin'] || Buffer.alloc(0)) === known && r.files['secret.txt']?.toString() === 'top secret\n', show(r));
  r = await open(['split.7z.001', 'split.7z.002']);
  check('split archive with a missing part: says which problem', /incomplete|parts/i.test(r.error || ''), r.error || JSON.stringify(r));
}
// 5b. Made by WinRAR 7.10: RAR5 with encrypted names in 3 volumes, and a ZIP split into .z01/.z02/.zip
if (fs.existsSync(F('r5.part1.rar'))) {
  let r = await opened(['r5.part1.rar', 'r5.part2.rar', 'r5.part3.rar'], 'mot de passe');
  let t = r.files ? sameTree(r.files, F('wr-src')) : { ok: false, info: show(r) };
  check('RAR5 (WinRAR), encrypted names, 3 volumes, Chinese + emoji names', t.ok, t.info);
  r = await opened(['split.z01', 'split.z02', 'split.zip']);
  t = r.files ? sameTree(r.files, F('wr-src')) : { ok: false, info: show(r) };
  check('ZIP split into .z01/.z02/.zip (WinRAR)', t.ok, t.info);
} else console.log('INFO WinRAR archives absent: skipped');
// 6. Less common formats from libarchive's own test suite, compared with tar.exe's extraction
for (const a of ['libarchive.cab', 'libarchive.lzh', 'libarchive-bzip2.7z']) {
  const r = await opened([a]); const t = r.files ? sameTree(r.files, byTar(a)) : { ok: false, info: show(r) };
  check(`${a} (libarchive test file) = tar.exe's extraction`, t.ok, t.info + (a.endsWith('.lzh') ? ` · note: ${await page.locator('div.bg-amber-50').innerText().catch(() => 'none')}` : ''));
}
// 7. Not an archive
{ const r = await open(['not-an-archive.zip']); check('text renamed .zip: says it is not an archive', /not an archive|damaged/i.test(r.error || ''), r.error || JSON.stringify(r)); }
// 8. One file's own Download: only that file, right bytes and name
{
  await open(['FolderTest.rar']);
  const row = page.locator('[data-entry="Folder1/Folder Space/long.txt"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), row.locator('[data-download]').click()]);
  const buf = fs.readFileSync(await dl.path());
  check('one file\'s Download: that file only, CRC stored by WinRAR', dl.suggestedFilename() === 'long.txt' && zlib.crc32(buf) === 4138211950, `${dl.suggestedFilename()} ${buf.length} bytes`);
}
// 9. Chromium: "Download all as ZIP" streamed into the file picked with showSaveFilePicker (stubbed: bytes captured)
if (engine === chromium && fs.existsSync(F('r5.part1.rar'))) {
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => {
    window.__keepPickers = true;
    window.showSaveFilePicker = async (opts) => ({ name: opts.suggestedName, createWritable: async () => { const parts = []; return new WritableStream({ write(c) { parts.push(c); }, close() { window.__zip = new Blob(parts); } }); } });
  });
  await p2.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
  await p2.locator('input[type=file]').setInputFiles(['r5.part1.rar', 'r5.part2.rar', 'r5.part3.rar'].map(F));
  await p2.locator('#archive-password').fill('mot de passe'); await p2.getByRole('button', { name: 'Unlock' }).click();
  await p2.getByRole('button', { name: 'Download all as ZIP' }).click();
  await p2.waitForFunction(() => window.__zip, null, { timeout: 120000 });
  const b64 = await p2.evaluate(async () => { const u = new Uint8Array(await window.__zip.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); });
  const zip = await JSZip.loadAsync(Buffer.from(b64, 'base64')); const files = {};
  for (const [n, f] of Object.entries(zip.files)) if (!f.dir) files[n] = await f.async('nodebuffer');
  const t = sameTree(files, F('wr-src'));
  await p2.locator('[data-status]').filter({ hasText: 'written to' }).waitFor({ timeout: 10000 }).catch(() => {});
  const st = await p2.locator('[data-status]').innerText().catch(() => '');
  check('Chromium: ZIP streamed to the picked file (showSaveFilePicker)', t.ok && /written to "r5\.zip"/.test(st), `${t.info} · ${st}`);
  await p2.close();
}
// 10. Cancel during "all as ZIP" (600 MiB, 3 batches: still running when Cancel is clicked), no ZIP comes out,
// and a file of the same archive can be extracted again
{
  await open(['slow.tar']);
  const seen = []; const onDl = (d) => seen.push(d.suggestedFilename()); page.on('download', onDl);
  await page.getByRole('button', { name: 'Download all as ZIP' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click({ timeout: 10000 });
  await alertBox().filter({ hasText: 'Cancelled.' }).waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000); // a ZIP finishing anyway would show up here
  page.off('download', onDl);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-entry="small.txt"] [data-download]').click()]);
  const txt = fs.readFileSync(await dl.path(), 'utf8');
  check('cancel stops (no ZIP comes out), says so, and the archive can be extracted again', seen.length === 0 && dl.suggestedFilename() === 'small.txt' && txt === 'still here after Cancel\n', `downloads after Cancel: ${seen.length} · then ${dl.suggestedFilename()} ${JSON.stringify(txt)}`);
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);
