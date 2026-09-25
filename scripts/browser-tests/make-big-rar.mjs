// Builds the 1.99 GB RAR used to compare the ZIP Extractor with ezyZip and to measure its per-file cap:
// two random files of 950 MiB (a.bin, b.bin) stored (-m0) in one RAR5 by WinRAR's Rar.exe, plus one random file of
// ~1.9 GB (one.bin, alone in cap.rar) for the per-file cap. The sources are kept next to the archives: the tests
// compare the extracted bytes with them.
// Usage: node scripts/browser-tests/make-big-rar.mjs <dir> [--cap-bytes=1900000000]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomFillSync } from 'node:crypto';
const dir = path.resolve(process.argv[2]); fs.mkdirSync(dir, { recursive: true });
const capBytes = Number((process.argv.find((a) => a.startsWith('--cap-bytes=')) || '=1900000000').split('=')[1]);
const RAR = 'C:\\Program Files\\WinRAR\\Rar.exe';
const random = (file, bytes) => {
  if (fs.existsSync(file) && fs.statSync(file).size === bytes) return;
  const fd = fs.openSync(file, 'w'); const chunk = Buffer.alloc(64 * 1024 * 1024);
  for (let done = 0; done < bytes; done += chunk.length) { const n = Math.min(chunk.length, bytes - done); randomFillSync(chunk, 0, n); fs.writeSync(fd, chunk, 0, n); }
  fs.closeSync(fd);
};
const rar = (out, names) => { fs.rmSync(path.join(dir, out), { force: true }); execFileSync(RAR, ['a', '-m0', '-ma5', '-ep1', '-idq', path.join(dir, out), ...names.map((n) => path.join(dir, n))]); };
random(path.join(dir, 'a.bin'), 950 * 1024 ** 2); random(path.join(dir, 'b.bin'), 950 * 1024 ** 2);
rar('big.rar', ['a.bin', 'b.bin']);
random(path.join(dir, 'one.bin'), capBytes);
rar('cap.rar', ['one.bin']);
for (const n of ['big.rar', 'cap.rar']) console.log(n, fs.statSync(path.join(dir, n)).size);
