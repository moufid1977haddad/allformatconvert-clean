// Builds the big archives of the ZIP Extractor's measurements, with WinRAR's Rar.exe (RAR5, stored: -m0):
//   big.rar   two random files of 950 MiB (1.99 GB): the comparison with ezyZip (zip-extractor-vs-ezyzip.mjs);
//   huge.rar  four of them (3.98 GB, over the 2.8 GiB that froze Firefox when everything was held in memory);
//   cap.rar / cap.zip  ONE random file of --cap-bytes (1.9 GB by default): the per-file cap (zip-extractor-cap.mjs);
//             the ZIP takes the page's other engine (zip.js), not 7-Zip.
// The sources are kept (src-big/, src-huge/, src-cap/): the tests compare the extracted bytes with them.
// Usage: node scripts/browser-tests/make-big-rar.mjs <dir> [--cap-bytes=1900000000] [--no-huge]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomFillSync } from 'node:crypto';
const dir = path.resolve(process.argv[2]);
const capBytes = Number((process.argv.find((a) => a.startsWith('--cap-bytes=')) || '=1900000000').split('=')[1]);
const WR = 'C:\\Program Files\\WinRAR\\';
const MiB950 = 950 * 1024 ** 2;
const random = (file, bytes) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.statSync(file).size === bytes) return false;
  const fd = fs.openSync(file, 'w'); const chunk = Buffer.alloc(64 * 1024 * 1024);
  for (let done = 0; done < bytes; done += chunk.length) { const n = Math.min(chunk.length, bytes - done); randomFillSync(chunk, 0, n); fs.writeSync(fd, chunk, 0, n); }
  fs.closeSync(fd); return true;
};
const archive = (out, src, names, zip) => {
  const target = path.join(dir, out);
  fs.rmSync(target, { force: true });
  const files = names.map((n) => path.join(dir, src, n));
  if (zip) execFileSync(WR + 'WinRAR.exe', ['a', '-afzip', '-m0', '-ibck', '-ep1', target, ...files]);
  else execFileSync(WR + 'Rar.exe', ['a', '-m0', '-ma5', '-ep1', '-idq', target, ...files]);
  console.log(out, fs.statSync(target).size);
};
const set = (src, names, bytes, outs) => { const fresh = names.map((n) => random(path.join(dir, src, n), bytes)).some(Boolean); for (const [out, zip] of outs) if (fresh || !fs.existsSync(path.join(dir, out))) archive(out, src, names, zip); else console.log(out, fs.statSync(path.join(dir, out)).size, '(kept)'); };
set('src-big', ['a.bin', 'b.bin'], MiB950, [['big.rar']]);
if (!process.argv.includes('--no-huge')) set('src-huge', ['a.bin', 'b.bin', 'c.bin', 'd.bin'], MiB950, [['huge.rar']]);
set('src-cap', ['one.bin'], capBytes, [['cap.rar'], ['cap.zip', true]]);
