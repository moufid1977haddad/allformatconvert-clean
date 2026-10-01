// P22 (02/10): builds raw-reference.json -- for each RAW file of raw-files.mjs, the pixels our WebAssembly LibRaw
// gives in Node (SHA-256 of the RGB bytes) and how they compare with LibRaw's own dcraw_emu 0.22.2 (official Win64
// build, `dcraw_emu -w -o 1 -g 2.4 12.92 -q 3`, PPM files made by dcraw-emu-refs.py).
// The browsers then have to give exactly the same pixels (scripts/browser-tests/p22-raw.mjs).
// Usage: node scripts/p22/make-reference.mjs <cache folder> <folder of dcraw_emu .ppm files>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { RAW_FILES, rawFile, sha256 } from './raw-files.mjs';

const [dir, emuDir] = process.argv.slice(2);
globalThis.self ??= globalThis; // the glue is built for workers
const root = path.resolve(import.meta.dirname, '../..');
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => fs.readFileSync(path.join(root, 'public/wasm/libraw.wasm')).buffer });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p22ref-'));
fs.mkdirSync(path.join(tmp, 'libraw'));
fs.copyFileSync(path.join(root, 'app/lib/libraw/libraw.mjs'), path.join(tmp, 'libraw/libraw.mjs'));
fs.copyFileSync(path.join(root, 'app/lib/rawFormats.js'), path.join(tmp, 'rawFormats.mjs'));
fs.writeFileSync(path.join(tmp, 'rawDecode.mjs'), fs.readFileSync(path.join(root, 'app/lib/rawDecode.js'), 'utf8').replace("from './rawFormats'", "from './rawFormats.mjs'"));
import { pathToFileURL } from 'node:url';
const { decodeRaw } = await import(pathToFileURL(path.join(tmp, 'rawDecode.mjs')).href);

function ppm(p) {
  const b = fs.readFileSync(p); let i = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[i]))) i++; const s = i; while (!/\s/.test(String.fromCharCode(b[i]))) i++; tok.push(b.toString('latin1', s, i)); }
  return { w: +tok[1], h: +tok[2], data: b.subarray(i + 1) };
}
const ref = { libraw: '0.22.2', wasmSha256: sha256(fs.readFileSync(path.join(root, 'public/wasm/libraw.wasm'))), files: {} };
for (const rel of RAW_FILES) {
  const f = await rawFile(rel, dir);
  const name = path.basename(f), bytes = fs.readFileSync(f);
  const entry = { rel, size: bytes.length, sha256: sha256(bytes) };
  try {
    const t = Date.now();
    const d = await decodeRaw(new Uint8Array(bytes), name);
    const rgb = Buffer.alloc(d.width * d.height * 3);
    for (let i = 0, n = d.width * d.height; i < n; i++) { rgb[i * 3] = d.rgba[i * 4]; rgb[i * 3 + 1] = d.rgba[i * 4 + 1]; rgb[i * 3 + 2] = d.rgba[i * 4 + 2]; }
    Object.assign(entry, { width: d.width, height: d.height, camera: d.camera, rgbSha256: sha256(rgb), nodeSeconds: (Date.now() - t) / 1000 });
    const e = path.join(emuDir, name + '.ppm');
    if (fs.existsSync(e)) {
      const p = ppm(e); let sum = 0, big = 0, max = 0;
      if (p.w !== d.width || p.h !== d.height) entry.dcrawEmu = `SIZE ${p.w}x${p.h}`;
      else { for (let i = 0; i < rgb.length; i++) { const x = Math.abs(rgb[i] - p.data[i]); sum += x; if (x > max) max = x; if (x > 2) big++; }
        entry.dcrawEmu = { mae: +(sum / rgb.length).toFixed(5), over2: +(big / rgb.length).toFixed(6), max }; }
    } else entry.dcrawEmu = 'dcraw_emu cannot read it';
  } catch (e) { entry.refused = e.message; }
  ref.files[name] = entry;
  console.log(name, JSON.stringify(entry.dcrawEmu || entry.refused));
}
fs.writeFileSync(path.join(import.meta.dirname, 'raw-reference.json'), JSON.stringify(ref, null, 1) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
