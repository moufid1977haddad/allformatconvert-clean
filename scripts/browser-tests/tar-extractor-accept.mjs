// Tar Extractor (30/09, real Safari 17.6 on the Mac): "t.tar.gz" could not be selected ("One or more files could not
// be selected") because `accept` listed the double extension ".tar.gz"; "t.tgz" passed. Checks, in the real page:
//  1. the picker's accept list has no double extension and names ".gz" and the gzip/tar MIME types
//     (Playwright's setInputFiles ignores `accept`, so the list itself is what is checked; Safari matches the LAST
//     extension, "gz", against it);
//  2. t.tar.gz, t.tgz and t.tar extract, every file byte-identical;
//  3. a .gz of a single file (not a TAR) is refused with a message that points to the ZIP Extractor.
// Usage: node scripts/browser-tests/tar-extractor-accept.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tar-accept-'));
const content = path.join(dir, 'content');
fs.mkdirSync(path.join(content, 'sub'), { recursive: true });
fs.writeFileSync(path.join(content, 'hello.txt'), 'Hello from a tar.gz\n');
fs.writeFileSync(path.join(content, 'sub', 'data.bin'), Buffer.from(Array.from({ length: 5000 }, (_, i) => (i * 7) % 256)));
execFileSync(process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar', ['-cf', path.join(dir, 't.tar'), '-C', content, 'hello.txt', 'sub/data.bin']); // Windows tar.exe / bsdtar
const tarBytes = fs.readFileSync(path.join(dir, 't.tar'));
fs.writeFileSync(path.join(dir, 't.tar.gz'), zlib.gzipSync(tarBytes));
fs.writeFileSync(path.join(dir, 't.tgz'), zlib.gzipSync(tarBytes));
fs.writeFileSync(path.join(dir, 'notes.txt.gz'), zlib.gzipSync(Buffer.from('just one compressed text file\n'.repeat(50))));
const expected = { 'hello.txt': fs.readFileSync(path.join(content, 'hello.txt')), 'data.bin': fs.readFileSync(path.join(content, 'sub', 'data.bin')) };

const b = await engine.launch();
try {
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/file-tools/tar-extractor`, { waitUntil: 'networkidle' });
  const accept = await p.locator('input[type=file]').getAttribute('accept');
  const tokens = accept.split(',').map((t) => t.trim());
  check(`accept has no double extension and lists .gz, .tgz, .tar, application/gzip, application/x-tar: "${accept}"`,
    !tokens.some((t) => /^\.[^.]+\.[^.]+/.test(t)) && ['.gz', '.tgz', '.tar', 'application/gzip', 'application/x-gzip', 'application/x-tar'].every((t) => tokens.includes(t)));
  for (const name of ['t.tar.gz', 't.tgz', 't.tar']) {
    await p.locator('input[type=file]').setInputFiles(path.join(dir, name));
    await p.getByText(/file\(s\) extracted/).waitFor({ timeout: 30000 });
    const links = p.locator('a[download]');
    const got = {};
    for (let i = 0; i < await links.count(); i++) {
      const [d] = await Promise.all([p.waitForEvent('download'), links.nth(i).click()]);
      const f = path.join(dir, `${name}-${d.suggestedFilename()}`); await d.saveAs(f); got[d.suggestedFilename()] = fs.readFileSync(f);
    }
    check(`${name}: ${Object.keys(got).length} files, byte-identical`, Object.keys(got).length === 2 && Object.entries(expected).every(([k, v]) => got[k] && Buffer.compare(got[k], v) === 0), Object.keys(got).join(', '));
  }
  await p.locator('input[type=file]').setInputFiles(path.join(dir, 'notes.txt.gz'));
  const alert = p.locator('p[role=alert]');
  await alert.waitFor({ timeout: 30000 });
  const msg = await alert.innerText();
  check('a .gz of one file (not a TAR): refused, pointing to the ZIP Extractor', /single compressed file, not a TAR archive/.test(msg) && /ZIP Extractor/.test(msg), msg);
  await ctx.close();
} finally {
  await b.close();
}
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);
