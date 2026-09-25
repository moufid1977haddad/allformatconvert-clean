// Hash Generator, real page: every algorithm, on text and on real files, compared with an independent reference
// (hash-reference.py: OpenSSL + the reference C implementations); HMAC; verify; Base64; checksums.txt checked
// by GNU sha256sum/md5sum -c; cancel. A file over 700 MiB exercises the streamed path of SHA-1/2.
// Usage: node scripts/browser-tests/hash-generator.mjs <origin or _vercel_share URL> <dir with test files> [--browser=firefox] [--mobile]
//   --mobile: Chromium as a Pixel 7 (100 MB in-memory ceiling, so the 3 MB file stays native and 760 MiB streams)
//   test files (made by the caller): empty.bin, one.bin (1 byte), r3.bin (3 MB random), big.bin (> 700 MiB)
import { chromium, firefox, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, dir] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const mobile = process.argv.includes('--mobile');
const b = await engine.launch(); const page = await (await b.newContext({ ...(mobile ? devices['Pixel 7'] : {}), acceptDownloads: true, permissions: engine === chromium ? ['clipboard-read', 'clipboard-write'] : [] })).newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const ALL = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'sha3_256', 'sha3_512', 'keccak256', 'blake2b', 'blake3', 'ripemd160', 'crc32', 'crc32c', 'xxh64', 'xxh3', 'xxh128'];
const HMAC_OK = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'sha3_256', 'sha3_512', 'blake2b', 'ripemd160'];
const ref = (file, key) => JSON.parse(execFileSync('python', [path.join('scripts', 'browser-tests', 'hash-reference.py'), file, ...(key ? [key] : [])], { maxBuffer: 1 << 20 }).toString());
const shown = async (scope) => Object.fromEntries(await scope.locator('[data-algorithm]').evaluateAll((els) => els.map((e) => [e.dataset.algorithm, e.textContent])));
const diff = (got, want, ids) => ids.filter((id) => got[id] !== want[id]);

await page.goto(origin + '/tools/developer-tools/hash-generator', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Select all' }).click();

// 1. Text, every algorithm, including the empty string and non-ASCII
const tmp = fs.mkdtempSync(path.join(dir, 'txt-'));
for (const [label, text] of [['empty text', ''], ['ASCII', 'The quick brown fox jumps over the lazy dog'], ['accents, CJK, emoji, newline', 'Héllo wörld — 你好 👨‍👩‍👧\nsecond line']]) {
  const f = path.join(tmp, 't.txt'); fs.writeFileSync(f, text, 'utf8');
  await page.getByLabel('Text to hash').fill(text + ' '); await page.getByLabel('Text to hash').fill(text); // force a fresh computation even for ''
  await page.waitForFunction((n) => document.querySelectorAll('[data-algorithm]').length === n, ALL.length, { timeout: 15000 });
  await page.waitForTimeout(600);
  const got = await shown(page), want = ref(f), bad = diff(got, want, ALL);
  check(`text: ${label}, 17 algorithms`, bad.length === 0, bad.length ? `wrong: ${bad.join(', ')} got ${got[bad[0]]} want ${want[bad[0]]}` : `${Buffer.byteLength(text)} bytes`);
}
// 2. HMAC on text (algorithms without HMAC must disappear, the others must equal Python's hmac)
{
  const f = path.join(tmp, 't.txt'); fs.writeFileSync(f, 'The quick brown fox jumps over the lazy dog', 'utf8');
  await page.getByLabel('Text to hash').fill('The quick brown fox jumps over the lazy dog');
  await page.getByPlaceholder('Leave empty for a plain hash').fill('key');
  await page.waitForFunction((n) => document.querySelectorAll('[data-algorithm]').length === n, HMAC_OK.length, { timeout: 15000 });
  await page.waitForTimeout(600);
  const got = await shown(page), want = ref(f, 'key'), bad = diff(got, want, HMAC_OK);
  check('HMAC (key "key"), 10 algorithms, others skipped', bad.length === 0 && Object.keys(got).length === HMAC_OK.length, `HMAC-SHA256 ${got.sha256?.slice(0, 16)}…${bad.length ? ' wrong: ' + bad : ''}`);
  await page.getByPlaceholder('Leave empty for a plain hash').fill('');
}
// 3. Base64 output
{
  await page.getByRole('combobox').first().selectOption('base64'); await page.waitForTimeout(400);
  const got = await shown(page), want = ref(path.join(tmp, 't.txt'));
  check('Base64 output', got.sha256 === Buffer.from(want.sha256, 'hex').toString('base64'), got.sha256);
  await page.getByRole('combobox').first().selectOption('hex');
}
// 4. Files, several at once, every algorithm
await page.getByRole('radio', { name: 'Files' }).click();
const small = ['empty.bin', 'one.bin', 'r3.bin'].map((n) => path.join(dir, n));
await page.locator('input[type=file]').setInputFiles(small);
await page.getByRole('button', { name: /^Hash 3 files$/ }).click();
await page.getByRole('button', { name: 'Download checksums.txt' }).waitFor({ timeout: 60000 });
const cards = page.locator('div.border.rounded-xl.p-4');
for (let i = 0; i < small.length; i++) {
  const got = await shown(cards.nth(i)), want = ref(small[i]), bad = diff(got, want, ALL);
  check(`file ${path.basename(small[i])}, 17 algorithms`, bad.length === 0, bad.length ? `wrong: ${bad.join(', ')}` : `${fs.statSync(small[i]).size} bytes`);
}
// 5. checksums.txt checked by GNU coreutils, which never saw the page's code
{
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download checksums.txt' }).click()]);
  const lines = fs.readFileSync(await dl.path(), 'utf8').trim().split('\n');
  for (const [tool, tag] of [['sha256sum', 'SHA256'], ['md5sum', 'MD5'], ['sha512sum', 'SHA512'], ['sha1sum', 'SHA1']]) {
    const f = path.join(dir, `check-${tag}.txt`); fs.writeFileSync(f, lines.filter((l) => l.startsWith(tag + ' (')).join('\n') + '\n');
    let out, ok; try { out = execFileSync(tool, ['-c', '--strict', path.basename(f)], { cwd: dir }).toString(); ok = (out.match(/: OK/g) || []).length === 3; } catch (e) { out = String(e.stdout || e.message); ok = false; }
    check(`checksums.txt verified by ${tool} -c`, ok, out.trim().replace(/\n/g, ' | '));
  }
  check('checksums.txt has one line per file and algorithm', lines.length === 3 * ALL.length, `${lines.length} lines`);
}
// 6. Verify against an expected hash: a match turns green, a wrong one says so
{
  const want = ref(small[2]);
  await page.getByPlaceholder('Paste the checksum published with the download').fill(want.sha256.toUpperCase());
  check('expected SHA-256 (uppercase) recognised', (await cards.nth(2).getByText('✓ matches the expected hash').count()) === 1 && (await cards.nth(0).getByRole('alert').count()) === 1);
  await page.getByPlaceholder('Paste the checksum published with the download').fill('0'.repeat(64));
  const msg = await cards.nth(2).getByRole('alert').innerText();
  check('wrong expected hash reported, with a length hint', /None of the selected algorithms/.test(msg) && /SHA-256/.test(msg), msg);
  await page.getByPlaceholder('Paste the checksum published with the download').fill('');
}
// 7. A file past the 700 MiB in-memory ceiling: SHA-1/2 streamed through hash-wasm; timed (common set)
{
  const big = path.join(dir, 'big.bin');
  await page.getByRole('button', { name: 'Defaults' }).click();
  for (const r of await page.getByRole('button', { name: 'Remove' }).all().then((a) => a.reverse())) await r.click();
  await page.locator('input[type=file]').setInputFiles(big);
  const t0 = Date.now();
  await page.getByRole('button', { name: /^Hash 1 file$/ }).click();
  await page.getByRole('button', { name: 'Download checksums.txt' }).waitFor({ timeout: 900000 });
  const secs = (Date.now() - t0) / 1000;
  const got = await shown(cards.nth(0)), want = ref(big), ids = ['md5', 'sha1', 'sha256', 'sha512', 'crc32'], bad = diff(got, want, ids);
  const mib = fs.statSync(big).size / 1048576;
  check(`big file ${mib.toFixed(0)} MiB, MD5+SHA-1+SHA-256+SHA-512+CRC32`, bad.length === 0, `${secs.toFixed(1)} s, ${(mib / secs).toFixed(0)} MiB/s${bad.length ? ' wrong: ' + bad : ''}`);
  // 8. Cancel mid-way
  await page.getByRole('button', { name: /^Hash 1 file$/ }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Cancel' }).click();
  check('cancel stops the job and says so', (await page.getByText(/^Cancelled\./).count()) === 1 && (await page.getByRole('button', { name: /^Hash 1 file$/ }).isEnabled()));
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()}${mobile ? ', emulated phone' : ''})`);
await b.close(); process.exit(fails ? 1 : 0);
