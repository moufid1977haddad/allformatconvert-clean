// GIF tools, audit of 29/09 (second pass): each check states the CORRECT behaviour; run against the build before the
// fixes it shows the defects, after them it must pass. Inputs: APNG files built here with upng-js (the library the
// tool decodes with), PNGs drawn in the page. Outputs are decoded here with gifuct-js (an independent GIF decoder) and
// read against the GIF89a specification: transparent colour index, disposal method, NETSCAPE2.0 loop count.
// GIF to MP4 is checked with a native ffmpeg/ffprobe (--ffmpeg=<path to ffmpeg.exe>; skipped without it).
// Usage: node scripts/browser-tests/gif-audit-2.mjs <origin> [--browser=chromium|firefox|webkit] [--ffmpeg=<path>] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import UPNG from 'upng-js';
import { parseGIF, decompressFrames } from 'gifuct-js';
import zlib from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import gifencLib from 'gifenc';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const b = await ({ chromium, firefox, webkit })[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
let fails = 0, passes = 0;
const errors = [];
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
let page;
const open = async (path) => { page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`)); await page.goto(origin + path, { waitUntil: 'networkidle' }); };
const T = async (n, fn) => { try { await fn(); } catch (e) { fails++; console.log('FAIL', `${name} ${n}`, String(e.message).split('\n')[0].slice(0, 200)); } finally { if (page) await page.close().catch(() => {}); page = null; } };

// 20x20 APNG, 2 frames of 250 ms: frame 1 = left half opaque red, right half transparent; frame 2 = the reverse in
// blue. numPlays is written into acTL (0 = forever).
function apng(numPlays) {
  const f = (left, rgb) => { const d = new Uint8Array(20 * 20 * 4); for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x < 10) === left) { const i = (y * 20 + x) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; } return d.buffer; };
  const buf = new Uint8Array(UPNG.encode([f(true, [255, 0, 0]), f(false, [0, 0, 255])], 20, 20, 0, [250, 250]));
  for (let i = 8; i < buf.length;) {
    const len = (buf[i] << 24 | buf[i + 1] << 16 | buf[i + 2] << 8 | buf[i + 3]) >>> 0;
    if (String.fromCharCode(...buf.slice(i + 4, i + 8)) === 'acTL') {
      new DataView(buf.buffer).setUint32(i + 12, numPlays);
      new DataView(buf.buffer).setUint32(i + 8 + len, zlib.crc32(buf.slice(i + 4, i + 8 + len)));
    }
    i += 12 + len;
  }
  return Buffer.from(buf);
}
// GIF bytes -> { w, h, frames: [{ rgba (composited, w*h*4), delay, disposal }], loop: null (no NETSCAPE block) | count }
function decodeGif(bytes) {
  const u = new Uint8Array(bytes);
  const g = parseGIF(u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength));
  const raw = decompressFrames(g, true);
  const w = g.lsd.width, h = g.lsd.height;
  let canvas = new Uint8ClampedArray(w * h * 4);
  const frames = [];
  for (const f of raw) {
    const before = canvas.slice();
    for (let y = 0; y < f.dims.height; y++) for (let x = 0; x < f.dims.width; x++) {
      const s = (y * f.dims.width + x) * 4, t = ((y + f.dims.top) * w + x + f.dims.left) * 4;
      if (f.patch[s + 3]) { canvas[t] = f.patch[s]; canvas[t + 1] = f.patch[s + 1]; canvas[t + 2] = f.patch[s + 2]; canvas[t + 3] = 255; }
    }
    frames.push({ rgba: canvas.slice(), delay: f.delay, disposal: f.disposalType });
    if (f.disposalType === 2) for (let y = 0; y < f.dims.height; y++) for (let x = 0; x < f.dims.width; x++) canvas.fill(0, ((y + f.dims.top) * w + x + f.dims.left) * 4, ((y + f.dims.top) * w + x + f.dims.left) * 4 + 4);
    if (f.disposalType === 3) canvas = before;
  }
  const n = Buffer.from(u).indexOf('NETSCAPE2.0');
  return { w, h, frames, loop: n < 0 ? null : u[n + 14] | (u[n + 15] << 8) };
}
// Colours after the browser's resampling: within 3 levels (Firefox gives 254 where Chromium gives 255).
const near = (p, q) => p.every((v, i) => Math.abs(v - q[i]) <= 3);
const px = (r, fr, x, y) => { const i = (y * r.w + x) * 4; return Array.from(r.frames[fr].rgba.slice(i, i + 4)); };
const gifFromLink = async (sel) => {
  const href = await page.locator(sel).first().getAttribute('href', { timeout: 30000 });
  return decodeGif(Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href)));
};
const makePng = (kind) => page.evaluate(async (k) => {
  const c = document.createElement('canvas'); const x = c.getContext('2d');
  if (k === 'holed') { c.width = c.height = 40; x.fillStyle = '#f00'; x.fillRect(10, 10, 20, 20); }
  if (k === 'blue') { c.width = c.height = 40; x.fillStyle = '#00f'; x.fillRect(0, 0, 40, 40); }
  if (k === 'wide') { c.width = 60; c.height = 20; x.fillStyle = '#f00'; x.fillRect(0, 0, 30, 20); x.fillStyle = '#00f'; x.fillRect(30, 0, 30, 20); }
  const bl = await new Promise((r) => c.toBlob(r, 'image/png'));
  return Array.from(new Uint8Array(await bl.arrayBuffer()));
}, kind);

await T('apng-to-gif transparency', async () => {
  await open('/tools/gif-tools/apng-to-gif');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'anim.png', mimeType: 'image/png', buffer: apng(0) });
  await page.getByRole('button', { name: 'Convert to GIF' }).click();
  const r = await gifFromLink('a[download$=".gif"]');
  check('apng-to-gif: 2 frames of 250 ms', r.frames.length === 2 && r.frames.every((f) => f.delay === 250), JSON.stringify(r.frames.map((f) => f.delay)));
  check('apng-to-gif: transparent pixels of the APNG stay transparent in the GIF (as ezgif), not black', px(r, 0, 15, 10)[3] === 0 && px(r, 0, 5, 10).join() === '255,0,0,255', `${px(r, 0, 15, 10)} / ${px(r, 0, 5, 10)}`);
  check('apng-to-gif: frame 1 does not show through the transparent part of frame 2', px(r, 1, 5, 10)[3] === 0 && px(r, 1, 15, 10).join() === '0,0,255,255', `${px(r, 1, 5, 10)} / ${px(r, 1, 15, 10)}`);
  check('apng-to-gif: an APNG that loops forever gives a GIF that loops forever', r.loop === 0, `loop ${r.loop}`);
});
await T('apng-to-gif play count', async () => {
  await open('/tools/gif-tools/apng-to-gif');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'once.png', mimeType: 'image/png', buffer: apng(1) });
  await page.getByRole('button', { name: 'Convert to GIF' }).click();
  const r = await gifFromLink('a[download$=".gif"]');
  check('apng-to-gif: an APNG played once gives a GIF played once (no NETSCAPE2.0 loop block)', r.loop === null, `loop ${r.loop}`);
});
await T('image-to-gif transparency and shapes', async () => {
  await open('/tools/gif-tools/image-to-gif');
  const files = [{ name: 'holed.png', mimeType: 'image/png', buffer: Buffer.from(await makePng('holed')) }, { name: 'wide.png', mimeType: 'image/png', buffer: Buffer.from(await makePng('wide')) }];
  await page.locator('input[type="file"]').first().setInputFiles(files);
  await page.waitForFunction(() => document.querySelectorAll('img').length >= 2);
  await page.getByRole('button', { name: 'Create GIF' }).click();
  const r = await gifFromLink('a[download$=".gif"]');
  check('image-to-gif: a transparent PNG stays transparent in the GIF, not black', px(r, 0, 2, 2)[3] === 0 && px(r, 0, 20, 20).join() === '255,0,0,255', `${px(r, 0, 2, 2)} / ${px(r, 0, 20, 20)}`);
  check('image-to-gif: a 60x20 image in a 40x40 GIF keeps its proportions (fitted, not stretched)', px(r, 1, 20, 3)[3] === 0 && near(px(r, 1, 5, 20), [255, 0, 0, 255]) && near(px(r, 1, 35, 20), [0, 0, 255, 255]), `${px(r, 1, 20, 3)} / ${px(r, 1, 5, 20)} / ${px(r, 1, 35, 20)}`);
});
// 21x15 GIF (odd sizes), 3 frames of 100, 200 and 300 ms, transparent background with a red 5x5 square.
function transparentGif() {
  const W = 21, H = 15, gif = gifencLib.GIFEncoder();
  [[100, 2], [200, 8], [300, 14]].forEach(([delay, x0]) => {
    const idx = new Uint8Array(W * H);
    for (let y = 5; y < 10; y++) for (let x = x0; x < x0 + 5; x++) idx[y * W + x] = 1;
    gif.writeFrame(idx, W, H, { palette: [[0, 0, 0], [255, 0, 0]], delay, transparent: true, transparentIndex: 0, dispose: 2 });
  });
  gif.finish();
  return Buffer.from(gif.bytes());
}
const FF = (process.argv.find((a) => a.startsWith('--ffmpeg=')) || '').slice(9);
if (FF) await T('gif-to-mp4', async () => {
  await open('/tools/gif-tools/gif-to-mp4');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'anim.gif', mimeType: 'image/gif', buffer: transparentGif() });
  await page.getByRole('button', { name: /Convert/ }).click();
  const href = await page.locator('a[download$=".mp4"]').first().getAttribute('href', { timeout: 120000 });
  const bytes = Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href));
  const f = path.join(os.tmpdir(), `gif-audit-${process.pid}.mp4`); fs.writeFileSync(f, bytes);
  const FP = FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  const pk = JSON.parse(execFileSync(FP, ['-v', 'error', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', f]).toString());
  const rgb = execFileSync(FF, ['-v', 'error', '-i', f, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  // Where the red square is (its left column) in the picture shown at time t.
  // The video resampled at 20 pictures per second (the fps filter keeps what is on screen at each instant).
  const all = execFileSync(FF, ['-v', 'error', '-i', f, '-vf', 'fps=20', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const squareAt = (t) => { const o = Math.floor(t * 20) * 20 * 14 * 3; if (o >= all.length) return -1; for (let x = 0; x < 20; x++) { const i = o + (7 * 20 + x) * 3; if (all[i] > 200 && all[i + 1] < 80) return x; } return -1; };
  const seen = [0.05, 0.15, 0.25, 0.35, 0.55].map(squareAt);
  const st = pk.streams[0], total = Number(pk.format.duration);
  fs.unlinkSync(f);
  check('gif-to-mp4: 21x15 GIF -> 20x14 video (H.264 needs even sizes, as the page says)', st.width === 20 && st.height === 14, `${st.width}x${st.height}`);
  check('gif-to-mp4: the timing of every frame is kept, the last one included (100/200/300 ms: 0.6 s in all)', Math.abs(total - 0.6) < 0.03 && [2, 8, 8, 14, 14].every((x, i) => Math.abs(seen[i] - x) <= 1) /* 21 -> 20 px rescale: +-1 px */, `duration ${total}, square at ${seen}`);
  const c = [rgb[0], rgb[1], rgb[2]];
  check('gif-to-mp4: the transparent background becomes white, as on a web page (not black)', c.every((v) => v > 235), c.join());
  const i = (7 * 20 + 4) * 3;
  check('gif-to-mp4: the red square stays red', rgb[i] > 200 && rgb[i + 1] < 60 && rgb[i + 2] < 60, [rgb[i], rgb[i + 1], rgb[i + 2]].join());
});

console.log(`\n${name}: ${passes} passed, ${fails} failed`);
if (errors.length) console.log('page errors:', errors.join('\n'));
await b.close();
process.exit(fails ? 1 : 0);
