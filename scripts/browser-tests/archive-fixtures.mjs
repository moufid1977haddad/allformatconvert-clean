// Builds the ZIP Extractor's test archives in <dir> (run once before zip-extractor.mjs).
// Independent sources wherever possible: RAR files from node-unrar.js's test suite (made by WinRAR), CAB/LZH from
// libarchive's test suite, TAR.GZ and ZIP by Windows' own tar.exe (libarchive); 7z/ZIP encryption and split
// volumes by 7-Zip (the same engine as the page, so only their decryption path is exercised, contents known).
// Usage: node scripts/browser-tests/archive-fixtures.mjs <dir>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const dir = path.resolve(process.argv[2]); fs.mkdirSync(dir, { recursive: true });
const get = async (url, name) => { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); fs.writeFileSync(path.join(dir, name), Buffer.from(await r.arrayBuffer())); };
const UNRAR = 'https://raw.githubusercontent.com/YuJianrong/node-unrar.js/master/testFiles/';
for (const f of ['FolderTest.rar', 'HeaderEnc1234.rar', 'WithComment.rar']) await get(UNRAR + f, f);
const LA = 'https://raw.githubusercontent.com/libarchive/libarchive/master/libarchive/test/';
for (const [uu, name] of [['test_read_format_cab_1.cab.uu', 'libarchive.cab'], ['test_read_format_lha_lh6.lzh.uu', 'libarchive.lzh'], ['test_read_format_7zip_bzip2.7z.uu', 'libarchive-bzip2.7z']]) {
  const text = await (await fetch(LA + uu)).text();
  const out = []; let on = false;
  for (const line of text.split(/\r?\n/)) { if (line.startsWith('begin ')) { on = true; continue; } if (line === 'end') break; if (on && line.length) { const n = (line.charCodeAt(0) - 32) & 63; const bytes = []; for (let i = 1; i < line.length; i += 4) { const c = [0, 1, 2, 3].map((k) => (line.charCodeAt(i + k) - 32) & 63); bytes.push((c[0] << 2) | (c[1] >> 4), ((c[1] & 15) << 4) | (c[2] >> 2), ((c[2] & 3) << 6) | c[3]); } out.push(...bytes.slice(0, n)); } }
  fs.writeFileSync(path.join(dir, name), Buffer.from(out));
}
// A tree with accented names, made by Windows' tar.exe (libarchive), and its known contents. (Windows' tar.exe
// crashes on names outside its ANSI code page, e.g. Chinese: those are covered by FolderTest.rar, made by WinRAR.)
const src = path.join(dir, 'tree'); fs.rmSync(src, { recursive: true, force: true });
fs.mkdirSync(path.join(src, 'Dossier é', 'sous-dossier'), { recursive: true });
fs.writeFileSync(path.join(src, 'readme.txt'), 'Hello from the archive\n');
fs.writeFileSync(path.join(src, 'Dossier é', 'photo.bin'), randomBytes(300000));
fs.writeFileSync(path.join(src, 'Dossier é', 'sous-dossier', 'note à lire.txt'), 'nested\n');
const TAR = 'C:\\Windows\\System32\\tar.exe';
execFileSync(TAR, ['-czf', path.join(dir, 'tree.tar.gz'), '-C', src, '.']);
execFileSync(TAR, ['-a', '-cf', path.join(dir, 'tree.zip'), '-C', src, '.']);
// 7-Zip (served copy): AES 7z with encrypted names, AES-256 ZIP, ZipCrypto ZIP, 7z split into 1 MB volumes
const { default: SevenZip } = await import(pathToFileURL(path.resolve('public/wasm/7zz.es6.js')).href);
const sz = await SevenZip({ print: () => {}, printErr: () => {} });
sz.FS.mkdir('/t'); sz.FS.mkdir('/t/d');
sz.FS.writeFile('/t/secret.txt', 'top secret\n'); sz.FS.writeFile('/t/d/data.bin', new Uint8Array(randomBytes(3000000)));
sz.FS.chdir('/t');
const mk = (args, out) => { const rc = sz.callMain(args); if (rc) throw new Error(args.join(' ') + ' -> ' + rc); fs.writeFileSync(path.join(dir, out), sz.FS.readFile(out)); };
mk(['a', '-t7z', '-pP@ss wörd', '-mhe=on', 'aes-names.7z', 'secret.txt', 'd'], 'aes-names.7z');
mk(['a', '-t7z', '-pdata-only', 'aes-data-only.7z', 'secret.txt'], 'aes-data-only.7z'); // names readable, data not
mk(['a', '-tzip', '-pzip-aes', '-mem=AES256', 'aes256.zip', 'secret.txt', 'd'], 'aes256.zip');
mk(['a', '-tzip', '-pzipcrypto', '-mem=ZipCrypto', 'zipcrypto.zip', 'secret.txt'], 'zipcrypto.zip');
sz.callMain(['a', '-t7z', '-mx0', '-v1m', 'split.7z', 'secret.txt', 'd']);
for (const n of sz.FS.readdir('/t').filter((n) => n.startsWith('split.7z.'))) fs.writeFileSync(path.join(dir, n), sz.FS.readFile(n));
fs.writeFileSync(path.join(dir, 'known-data.bin'), sz.FS.readFile('/t/d/data.bin'));
// With WinRAR installed (7.10 here): RAR5 with encrypted names in 3 volumes, and a ZIP split into .z01/.z02/.zip,
// from a tree with Chinese and emoji names
const WR = 'C:\\Program Files\\WinRAR';
if (fs.existsSync(path.join(WR, 'Rar.exe'))) {
  // WinRAR adds to existing volumes instead of replacing them: remove the previous run's
  for (const n of fs.readdirSync(dir).filter((n) => /^(r5(\.part\d+)?\.rar|split\.z\d+|split\.zip)$/.test(n))) fs.rmSync(path.join(dir, n));
  const wsrc = path.join(dir, 'wr-src'); fs.rmSync(wsrc, { recursive: true, force: true });
  fs.mkdirSync(path.join(wsrc, 'Dossier 中文'), { recursive: true });
  fs.writeFileSync(path.join(wsrc, 'Dossier 中文', 'big 👍.bin'), randomBytes(2500000));
  fs.writeFileSync(path.join(wsrc, 'à lire.txt'), 'bonjour\n');
  execFileSync(path.join(WR, 'Rar.exe'), ['a', '-ma5', '-hpmot de passe', '-v1m', '-m3', '-r', '-ep1', '-idq', path.join(dir, 'r5.rar'), wsrc + '\\*']);
  execFileSync(path.join(WR, 'WinRAR.exe'), ['a', '-afzip', '-v1m', '-ibck', '-r', '-ep1', path.join(dir, 'split.zip'), wsrc + '\\*']);
} else console.log('WinRAR not found: RAR5 volumes and .z01 split ZIP skipped');
// Big enough (3 x 200 MiB, 3 batches) for Cancel to be clicked while "all as ZIP" runs, in any browser
const slow = path.join(dir, 'slow'); fs.rmSync(slow, { recursive: true, force: true }); fs.mkdirSync(slow);
for (const n of ['1.bin', '2.bin', '3.bin']) fs.writeFileSync(path.join(slow, n), randomBytes(200 * 1024 ** 2));
fs.writeFileSync(path.join(slow, 'small.txt'), 'still here after Cancel\n');
execFileSync(TAR, ['-cf', path.join(dir, 'slow.tar'), '-C', slow, '.']);
// Not an archive; and 3 GiB of zeros gzipped (a few MB) to exercise the extracted-size cap
fs.writeFileSync(path.join(dir, 'not-an-archive.zip'), 'this is plain text, renamed .zip\n');
const zeros = path.join(dir, 'zeros.bin'); fs.writeFileSync(zeros, ''); fs.truncateSync(zeros, 3 * 1024 ** 3);
execFileSync(TAR, ['-czf', path.join(dir, 'bomb-3gib.tar.gz'), '-C', dir, 'zeros.bin']); fs.rmSync(zeros);
console.log(fs.readdirSync(dir).filter((n) => !fs.statSync(path.join(dir, n)).isDirectory()).map((n) => `${n} ${fs.statSync(path.join(dir, n)).size}`).join('\n'));
