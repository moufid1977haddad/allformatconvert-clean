// Opens any archive 7-Zip reads (ZIP, RAR/RAR5, 7z, TAR, GZ, BZ2, XZ, ISO, CAB, WIM, DMG, ARJ, LZH, RPM, DEB...)
// and extracts ON DEMAND: 'open' lists the archive, 'get' extracts only the paths asked for. Same means as ezyZip,
// the reference (read 2026-09-24: its worker loads 7-Zip as WebAssembly, zip.js and libarchive.js, and extracts a
// file when its Save is clicked). Measured on the same 1.99 GB RAR: extracting everything first took 22 s before
// the first download, ezyZip 6.2 s; and holding everything in memory froze Firefox at 2.8 GB.
//
// 7-Zip 24.09 compiled to WebAssembly (7z-wasm; LGPL + unRAR restriction, public/wasm/7zz-LICENSE.txt), served
// unmodified from /wasm and imported at run time, not bundled (its Node-only branch imports "module", which a
// browser bundle cannot resolve). The archive is mounted with WORKERFS: read from disk in pieces, never copied.
// Encrypted archives: a sentinel password is passed when none is known, so 7-Zip fails with "Wrong password"
// instead of waiting on stdin, and the page asks the visitor for one.
//
// ZIP files go through zip.js (BSD-3; ezyZip loads it too): this 7-Zip build has no code-page conversion, so a
// ZIP without the UTF-8 flag (Windows' "Compressed folder", old tools) came out with garbled names and even merged
// paths ("Dossier é/photo.bin" -> "Dossier 򯰨oto.bin", measured). zip.js decodes those names as UTF-8 when valid,
// else as CP437 as the ZIP specification says. 7-Zip stays the fallback for the compression methods zip.js lacks.
import { ZipReader, BlobReader, BlobWriter, SplitDataReader, configure, ERR_INVALID_PASSWORD, ERR_ENCRYPTED, ERR_UNSUPPORTED_COMPRESSION } from '@zip.js/zip.js';

configure({ useWebWorkers: false }); // already in a worker

const NO_PASSWORD = '\u0001no-password\u0001';
// Clean relative path: no leading slash, no "." or ".." segments.
const safePath = (p) => p.replace(/\\/g, '/').split('/').filter((s) => s && s !== '.' && s !== '..').join('/');
const progress = (() => { let last = 0; return (pct) => { const now = Date.now(); if (now - last > 200) { last = now; self.postMessage({ type: 'progress', pct: Math.min(99, Math.round(pct)) }); } }; })();

let session = null; // { kind: 'zip', zr, byPath, password } | { kind: '7z', archive, password, stagedTar }

/* ---------------- ZIP (zip.js) ---------------- */

// The ZIP's parts in order (name.z01, name.z02, ..., name.zip), or null when this is not a ZIP.
async function zipParts(files) {
  if (files.length === 1) {
    const sig = new Uint8Array(await files[0].slice(0, 4).arrayBuffer());
    return sig[0] === 0x50 && sig[1] === 0x4b && [3, 5, 7].includes(sig[2]) ? files : null;
  }
  const last = files.find((f) => /\.zip$/i.test(f.name));
  if (!last) return null;
  const base = last.name.slice(0, -4).toLowerCase();
  const num = (f) => Number((f.name.match(/\.z(\d+)$/i) || [])[1]);
  const parts = files.filter((f) => f !== last && f.name.toLowerCase().startsWith(base + '.z') && num(f) > 0).sort((a, b) => num(a) - num(b));
  return parts.length === files.length - 1 ? [...parts, last] : null;
}
const isPasswordError = (e) => [ERR_INVALID_PASSWORD, ERR_ENCRYPTED].includes(e?.message);

async function zipOpen(parts, password) {
  const zr = new ZipReader(parts.length > 1 ? new SplitDataReader(parts.map((p) => new BlobReader(p))) : new BlobReader(parts[0]));
  const entries = await zr.getEntries();
  const enc = entries.filter((e) => e.encrypted && !e.directory).sort((a, b) => a.compressedSize - b.compressedSize);
  if (enc.length) {
    if (!password) { await zr.close(); return { type: 'password', retry: false }; }
    try { await enc[0].getData(new BlobWriter(), { password, checkSignature: true }); } catch (e) { await zr.close(); if (isPasswordError(e)) return { type: 'password', retry: true }; throw e; }
  }
  const byPath = new Map();
  for (const e of entries) if (!e.directory) byPath.set(safePath(e.filename), e);
  session = { kind: 'zip', zr, byPath, password };
  return { type: 'listing', entries: [...byPath].map(([path, e]) => ({ path, size: e.uncompressedSize, encrypted: e.encrypted })), format: parts.length > 1 ? 'zip, split' : 'zip', volumes: parts.length };
}

async function zipGet(paths) {
  const want = paths.map((p) => session.byPath.get(p));
  const total = want.reduce((s, e) => s + e.compressedSize, 0) || 1;
  let done = 0;
  const files = [];
  for (const [i, e] of want.entries()) {
    const blob = await e.getData(new BlobWriter(), { password: e.encrypted ? session.password : undefined, checkSignature: true, onprogress: (p) => progress(((done + p) / total) * 100) });
    done += e.compressedSize;
    files.push({ path: paths[i], blob, size: blob.size });
  }
  return { type: 'files', files, warning: '' };
}

/* ---------------- everything else (7-Zip) ---------------- */

let sz = null;
let lines = [];
async function load() {
  if (sz) return;
  const wasm = await fetch('/wasm/7zz.wasm').then((r) => { if (!r.ok) throw new Error(`The extraction engine could not be downloaded (HTTP ${r.status}).`); return r.arrayBuffer(); });
  const { default: SevenZip } = await import(/* webpackIgnore: true */ '/wasm/7zz.es6.js');
  sz = await SevenZip({ wasmBinary: wasm, print: (l) => lines.push(l), printErr: (l) => lines.push(l) });
  installReadAhead();
  installPreallocation();
}
function run(args) {
  lines = [];
  let code;
  try { code = sz.callMain(args); } catch (e) { code = typeof e?.status === 'number' ? e.status : 2; lines.push(String(e?.message || e)); }
  return { code, out: lines.join('\n') };
}
const wrongPassword = (out) => /Wrong password|Cannot open encrypted archive|Data Error in encrypted file/i.test(out);

// 7-Zip's technical listing: blocks of "Key = value" lines, one block per entry after the "----------" line.
function parseListing(out) {
  const body = out.split(/\n-{10}\n/).slice(1).join('\n');
  return body.split(/\n\s*\n/).map((block) => {
    const e = {};
    for (const line of block.split('\n')) { const i = line.indexOf(' = '); if (i > 0) e[line.slice(0, i)] = line.slice(i + 3); }
    return e;
  }).filter((e) => e.Path !== undefined).map((e) => ({
    path: e.Path, size: Number(e.Size || 0), dir: e.Folder === '+' || /D/.test(e.Attributes || ''), link: /^l/.test(e.Attributes || '') || !!e['Symbolic Link'], encrypted: e.Encrypted === '+',
  }));
}
function rmrf(path) {
  let st; try { st = sz.FS.lstat(path); } catch { return; }
  if (sz.FS.isDir(st.mode)) { for (const n of sz.FS.readdir(path)) if (n !== '.' && n !== '..') rmrf(`${path}/${n}`); sz.FS.rmdir(path); } else sz.FS.unlink(path);
}
// WORKERFS reads the archive with one FileReaderSync call per 7-Zip read, and 7-Zip reads 128 KB at a time: 7 612
// calls for one 950 MiB file of a stored RAR, most of the extraction time. Reading 16 MB ahead and serving the next
// reads from it (measured 2026-09-25, same file): 7-Zip's extraction 10 s -> 4.2 s in Chromium, 8.5 s -> 6.7 s in
// Firefox; 64 MB ahead gains nothing more. Same result as WORKERFS's own read: bytes [position, position + length)
// of the file, cut at its end.
const READ_AHEAD = 16 * 1024 * 1024;
let readCache = null; // { node, start, bytes }
let onRead = null;
function installReadAhead() {
  const reader = new FileReaderSync();
  sz.WORKERFS.stream_ops.read = function (stream, buffer, offset, length, position) {
    const node = stream.node;
    if (position >= node.size) return 0;
    const end = Math.min(node.size, position + length);
    const c = readCache;
    if (!c || c.node !== node || position < c.start || end > c.start + c.bytes.length) {
      readCache = { node, start: position, bytes: new Uint8Array(reader.readAsArrayBuffer(node.contents.slice(position, Math.min(node.size, Math.max(end, position + READ_AHEAD))))) };
    }
    buffer.set(readCache.bytes.subarray(position - readCache.start, end - readCache.start), offset);
    onRead?.(end - position);
    return end - position;
  };
}
// 7-Zip writes each extracted file 128 KB at a time into Emscripten's in-memory file, which grows by 1/8 and copies
// itself at every step (about nine copies of the whole file), then readFile() copied it once more. The sizes are
// known from the listing, so the file is allocated once at its exact size and handed over without a copy (measured
// 2026-09-25, 950 MiB stored in a RAR: 7-Zip's extraction 4.8 s -> 2.05 s in Chromium, 7.0 s -> 4.7 s in Firefox;
// writing nothing at all takes 1.83 s). A write past the expected size falls back to Emscripten's own growth.
let expectedSizes = null; // Map of '/out/<entry>' -> size, during a 'get'
function installPreallocation() {
  sz.FS.writeFile('/probe', ''); const ops = sz.FS.lookupPath('/probe').node.stream_ops; sz.FS.unlink('/probe');
  const write = ops.write;
  ops.write = function (stream, buffer, offset, length, position, canOwn) {
    const want = expectedSizes?.get(stream.path);
    if (!want || !length || position + length > want) return write.call(this, stream, buffer, offset, length, position, canOwn);
    const node = stream.node;
    if (!node.contents || node.contents.length < want) {
      const c = new Uint8Array(want);
      if (node.usedBytes) c.set(node.contents.subarray(0, node.usedBytes));
      node.contents = c;
    }
    node.contents.set(buffer.subarray(offset, offset + length), position);
    node.usedBytes = Math.max(node.usedBytes, position + length);
    node.mtime = node.ctime = Date.now();
    return length;
  };
}
// An extracted file as a Blob, straight from the in-memory file (no copy but the Blob's own), in pieces of at most
// 1 GiB: Firefox refuses to build a Blob from one array over 2 GB.
function takeFile(path) {
  const node = sz.FS.lookupPath(path).node;
  const n = node.usedBytes, c = node.contents;
  const parts = [];
  for (let i = 0; i < n; i += 1 << 30) parts.push(c.subarray(i, Math.min(n, i + (1 << 30))));
  const blob = new Blob(parts);
  sz.FS.unlink(path); // free the worker's copy
  return blob;
}
// Progress: count the bytes 7-Zip reads from the archive (it prints nothing until the end).
function watchReads(total) {
  let seen = 0;
  onRead = (n) => { seen += n; progress((seen / total) * 100); };
  return () => { onRead = null; readCache = null; };
}

// A .tar.gz/.tgz/.tar.bz2/.tar.xz/.tar.zst opens in 7-Zip as a compressor holding one .tar, and its command line
// cannot chain the two (-ttar.gzip: E_NOTIMPL, tried). So the .tar is unpacked into memory first, then opened.
const COMPRESSORS = /^(gzip|bzip2|xz|zstd|lzma|lzma86|lzip|z|brotli|lz4)$/i;
const TAR_NAME = { gzip: 'tar.gz', bzip2: 'tar.bz2', xz: 'tar.xz', zstd: 'tar.zst', lzma: 'tar.lzma', lzip: 'tar.lz', z: 'tar.Z', brotli: 'tar.br', lz4: 'tar.lz4' };
const tarName = (t) => TAR_NAME[t.toLowerCase()] || `tar.${t}`;

async function sevenOpen(files, main, password, maxTarBytes) {
  await load();
  rmrf('/stage'); rmrf('/out');
  try { sz.FS.unmount('/in'); } catch { /* first time */ }
  try { sz.FS.mkdir('/in'); } catch { /* exists */ }
  sz.FS.mount(sz.WORKERFS, { files }, '/in');
  readCache = null;
  const pw = '-p' + (password || NO_PASSWORD);
  let archive = `/in/${main}`;
  let r = run(['l', '-slt', '-sccUTF-8', pw, archive]);
  if (wrongPassword(r.out)) return { type: 'password', retry: !!password };
  if (r.code >= 2) return { type: 'error', message: explain(r.out) };
  let format = ((r.out.match(/\nType = (.+)/) || [])[1] || '').toLowerCase();
  const volumes = Number((r.out.match(/\nVolumes = (\d+)/) || [])[1] || 1);
  let entries = parseListing(r.out);
  let stagedTar = 0;
  if (COMPRESSORS.test(format) && entries.length === 1 && /\.tar$/i.test(entries[0].path)) {
    const tarSize = entries[0].size;
    if (tarSize > maxTarBytes) return { type: 'error', message: `This ${tarName(format)} holds a ${fmt(tarSize)} .tar, which has to be unpacked in memory before its files can be listed — over the ${fmt(maxTarBytes)} this page can hold. Use a desktop app such as 7-Zip for this one.` };
    sz.FS.mkdir('/stage');
    const unwatch = watchReads(files.reduce((s, f) => s + f.size, 0) || 1);
    const u = run(['x', '-y', '-sccUTF-8', pw, '-o/stage', archive]);
    unwatch();
    if (u.code >= 2) { rmrf('/stage'); return { type: 'error', message: explain(u.out) }; }
    archive = `/stage/${sz.FS.readdir('/stage').find((n) => n !== '.' && n !== '..')}`;
    r = run(['l', '-slt', '-sccUTF-8', pw, archive]);
    if (r.code >= 2) return { type: 'error', message: explain(r.out) };
    format = tarName(format); entries = parseListing(r.out); stagedTar = tarSize;
  }
  session = { kind: '7z', archive, password, stagedTar, total: stagedTar || files.reduce((s, f) => s + f.size, 0) || 1 };
  const links = entries.filter((e) => e.link).length;
  return { type: 'listing', entries: entries.filter((e) => !e.dir && !e.link).map((e) => ({ path: safePath(e.path), raw: e.path, size: e.size, encrypted: e.encrypted })), format, volumes, stagedTar, links };
}

async function sevenGet(raws, sizes) {
  rmrf('/out'); sz.FS.mkdir('/out');
  // -spd: names are literal, never wildcards; -i@: only these entries (a solid block is still decoded from its start)
  sz.FS.writeFile('/want.txt', raws.join('\n') + '\n');
  const unwatch = session.stagedTar ? () => {} : watchReads(session.total);
  expectedSizes = new Map(raws.map((raw, i) => [`/out/${raw}`, sizes?.[i] || 0]));
  let r;
  try { r = run(['x', '-y', '-sccUTF-8', '-scsUTF-8', '-spd', '-p' + (session.password || NO_PASSWORD), '-i@/want.txt', '-o/out', session.archive]); } finally { expectedSizes = null; unwatch(); }
  if (wrongPassword(r.out)) { rmrf('/out'); return { type: 'password', retry: !!session.password }; }
  const files = [];
  for (const raw of raws) {
    const p = `/out/${raw}`;
    let st; try { st = sz.FS.lstat(p); } catch { continue; }
    if (!sz.FS.isFile(st.mode)) continue;
    const blob = takeFile(p); // hand it over, and free the worker's copy
    files.push({ raw, blob, size: blob.size });
  }
  rmrf('/out');
  const missing = raws.length - files.length;
  return { type: 'files', files, warning: r.code >= 2 ? explain(r.out) : (missing ? `${missing} file${missing > 1 ? 's' : ''} could not be extracted.` : '') };
}

/* ---------------- messages ---------------- */

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'open') {
      if (session?.kind === 'zip') await session.zr.close().catch(() => {});
      session = null;
      const parts = await zipParts(data.files);
      if (parts) {
        try { self.postMessage(await zipOpen(parts, data.password)); return; } catch (e) {
          if (isPasswordError(e)) { self.postMessage({ type: 'password', retry: !!data.password }); return; }
          if (e?.message !== ERR_UNSUPPORTED_COMPRESSION) { self.postMessage({ type: 'error', message: zipExplain(e, parts.length) }); return; }
        } // a compression method zip.js lacks: 7-Zip below
      }
      self.postMessage(await sevenOpen(data.files, data.main, data.password, data.maxTarBytes));
      return;
    }
    if (data.type === 'get') {
      if (data.password) session.password = data.password;
      if (session.kind === 'zip') {
        try { self.postMessage(await zipGet(data.paths)); } catch (e) {
          if (isPasswordError(e)) self.postMessage({ type: 'password', retry: !!data.password });
          else self.postMessage({ type: 'error', message: zipExplain(e, 1) });
        }
      } else self.postMessage(await sevenGet(data.raws, data.sizes));
    }
  } catch (e) {
    self.postMessage({ type: 'error', message: /memory|allocation|Array buffer/i.test(String(e?.message)) ? 'This browser tab ran out of memory extracting these files.' : (e?.message || String(e)) });
  }
};

const fmt = (n) => (n < 1e6 ? `${(n / 1e3).toFixed(0)} KB` : n < 1e9 ? `${(n / 1e6).toFixed(0)} MB` : `${(n / 1e9).toFixed(2)} GB`); // decimal, like the page

function zipExplain(e, nParts) {
  const m = String(e?.message || e);
  if (/End of central directory|Central directory header not found|Local file header not found|offset|Split zip file/i.test(m)) {
    return nParts > 1 ? 'The archive is incomplete: if it is split into parts (.part1.rar, .7z.001, .z01…), choose all of its parts together.' : 'This ZIP file is damaged or incomplete (its table of contents could not be found). If it is split into parts (.z01, .z02…), choose all of them together.';
  }
  if (/CRC|signature/i.test(m)) return 'The archive is damaged: a file failed its integrity check.';
  return 'The ZIP could not be read: ' + m;
}

// 7-Zip's own words, trimmed to what a visitor can act on.
function explain(out) {
  if (/Can not open the file as archive|Cannot open the file as archive|is not archive/i.test(out)) return 'This file is not an archive 7-Zip can open, or it is damaged.';
  if (/Missing volume|Unexpected end of archive|There are some data after the end|Unconfirmed start of archive/i.test(out)) return 'The archive is incomplete: if it is split into parts (.part1.rar, .7z.001, .z01…), choose all of its parts together.';
  if (/Unsupported Method/i.test(out)) return 'This archive uses a compression method 7-Zip cannot decode.';
  if (/CRC Failed|Data Error|Headers Error/i.test(out)) return 'The archive is damaged: some files failed their integrity check.';
  const err = out.split('\n').filter((l) => /ERROR|Error/i.test(l)).slice(0, 2).join(' ').trim();
  return err || 'The archive could not be extracted.';
}
