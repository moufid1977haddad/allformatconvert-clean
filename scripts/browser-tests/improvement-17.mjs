// Improvement 17, real pages: GIF Maker (fit instead of stretch, crop, background, output size, order, loop count),
// QR Scanner (camera, drop, paste), Audio Trimmer (tenths of a second, fades). Every output is decoded here:
// GIF frames by gifuct-js, WAV samples read directly; nothing is taken from the page's own numbers.
// Camera: Chromium is fed a Y4M video made here with a QR code in it (--use-file-for-fake-video-capture); Firefox's
// fake camera shows its own test pattern, so there only start/stop/no-false-read is checked.
// Usage: node scripts/browser-tests/improvement-17.mjs <origin> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const isFx = process.argv.includes('--browser=firefox');
const engine = isFx ? firefox : chromium;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'imp17-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

/* ---------- fixtures ---------- */
function frame(w, h, color) { const c = createCanvas(w, h); const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = color; x.beginPath(); x.arc(w / 2, h / 2, 100, 0, Math.PI * 2); x.fill(); const f = path.join(tmp, `${color.slice(1)}-${w}x${h}.png`); fs.writeFileSync(f, c.toBuffer('image/png')); return f; }
const F = [frame(400, 300, '#ff0000'), frame(300, 400, '#0000ff'), frame(400, 300, '#00a000')];
const QR_TEXT = 'https://www.onlineconvertools.com/camera-test?id=17';
const qrPng = await QRCode.toBuffer(QR_TEXT, { width: 360, margin: 4 }); const qrFile = path.join(tmp, 'qr.png'); fs.writeFileSync(qrFile, qrPng);
async function y4m(file) { // 640x480, 20 frames of the QR code on white, I420
  const W = 640, H = 480; const c = createCanvas(W, H); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.drawImage(await loadImage(qrPng), (W - 360) / 2, (H - 360) / 2); const d = x.getImageData(0, 0, W, H).data;
  const Y = Buffer.alloc(W * H), U = Buffer.alloc(W * H / 4), V = Buffer.alloc(W * H / 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4; Y[j * W + i] = Math.round(0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]); }
  U.fill(128); V.fill(128);
  const parts = [Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`)]; for (let n = 0; n < 20; n++) parts.push(Buffer.from('FRAME\n'), Y, U, V);
  fs.writeFileSync(file, Buffer.concat(parts));
}
const camFile = path.join(tmp, 'qr.y4m'); await y4m(camFile);
function wav(seconds, rate = 44100) { // mono 16-bit, 1 kHz sine at half scale
  const n = Math.round(seconds * rate); const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(16384 * Math.sin((2 * Math.PI * 1000 * i) / rate)), 44 + i * 2);
  const f = path.join(tmp, 'tone.wav'); fs.writeFileSync(f, b); return f;
}
const toneFile = wav(5);
function readWav(buf) { // -> { rate, channels, samples: Float32 of channel 0 }
  let i = 12, rate = 0, ch = 1, bits = 16, data = null;
  while (i + 8 <= buf.length) { const id = buf.toString('latin1', i, i + 4), len = buf.readUInt32LE(i + 4); if (id === 'fmt ') { ch = buf.readUInt16LE(i + 10); rate = buf.readUInt32LE(i + 12); bits = buf.readUInt16LE(i + 22); } if (id === 'data') { data = buf.subarray(i + 8, i + 8 + len); break; } i += 8 + len + (len & 1); }
  const n = data.length / 2 / ch; const s = new Float32Array(n); for (let k = 0; k < n; k++) s[k] = data.readInt16LE(k * 2 * ch) / 32768;
  return { rate, channels: ch, bits, samples: s };
}
const rms = (s, a, b) => { let t = 0; for (let i = a; i < b; i++) t += s[i] * s[i]; return Math.sqrt(t / Math.max(1, b - a)); };

/* ---------- browser ---------- */
const b = await engine.launch(isFx
  ? { firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true } }
  : { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${camFile}`] });
const ctx = await b.newContext({ acceptDownloads: true, ...(isFx ? {} : { permissions: ['camera'] }) });
const dl = async (p, sel) => { const [d] = await Promise.all([p.waitForEvent('download'), p.locator(sel).first().click()]); return { name: d.suggestedFilename(), bytes: fs.readFileSync(await d.path()) }; };

/* ---------- GIF Maker ---------- */
{
  const p = await ctx.newPage(); await p.goto(origin + '/tools/gif-tools/gif-maker', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(F); await p.locator('[data-frame="2"]').waitFor();
  const make = async (opts = {}) => {
    for (const [id, v] of Object.entries(opts)) { const el = p.locator('#' + id); if ((await el.getAttribute('type')) === 'color') await el.evaluate((e, val) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, val); e.dispatchEvent(new Event('input', { bubbles: true })); }, v); else if ((await el.evaluate((e) => e.tagName)) === 'SELECT') await el.selectOption(v); else await el.fill(String(v)); }
    await p.getByRole('button', { name: 'Create GIF' }).click(); await p.locator('[data-result]').waitFor({ timeout: 60000 });
    const g = await dl(p, 'a[download="animated.gif"]'); const gif = parseGIF(g.bytes.buffer.slice(g.bytes.byteOffset, g.bytes.byteOffset + g.bytes.length));
    return { gif, frames: decompressFrames(gif, true), bytes: g.bytes };
  };
  // bounding box of the non-white, non-background pixels of one colour family in a frame
  const bbox = (fr, W, test) => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const px = fr.patch; for (let i = 0; i < px.length; i += 4) { if (!test(px[i], px[i + 1], px[i + 2])) continue; const k = i / 4, x = k % fr.dims.width, y = Math.floor(k / fr.dims.width); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
  const blue = (r, g, bb) => bb > 150 && r < 100 && g < 100;
  let r = await make({});
  const d0 = bbox(r.frames[1], r.gif.lsd.width, (rr, g, bb) => bb > 150 && rr < 100 && g < 100);
  check("default size = largest width and height (ezgif's default): 400x400, the portrait frame at its own size (circle 200 px)", r.gif.lsd.width === 400 && r.gif.lsd.height === 400 && Math.abs(d0.w - 200) <= 2 && Math.abs(d0.h - 200) <= 2, `${r.gif.lsd.width}x${r.gif.lsd.height} circle ${d0.w}x${d0.h}`);
  r = await make({ 'gm-size': 'first', 'gm-fit': 'fit', 'gm-bg': '#ffff00' });
  const W = r.gif.lsd.width, H = r.gif.lsd.height; const bx = bbox(r.frames[1], W, blue); const fr = r.frames[1].patch;
  check('fit (default): 400x300 GIF, the 300x400 frame keeps a round circle, yellow bars at the sides', W === 400 && H === 300 && Math.abs(bx.w / bx.h - 1) < 0.04 && fr[0] > 200 && fr[1] > 200 && fr[2] < 60, `${W}x${H} circle ${bx.w}x${bx.h} corner rgb(${fr[0]},${fr[1]},${fr[2]})`);
  r = await make({ 'gm-fit': 'stretch' });
  const bs = bbox(r.frames[1], 400, blue);
  check('stretch (the old behaviour, on request): the same circle comes out oval', bs.w / bs.h > 1.5, `${bs.w}x${bs.h}`);
  r = await make({ 'gm-fit': 'fill' });
  const bf = bbox(r.frames[1], 400, blue);
  check('crop to fill: round and larger (133 px radius), no bars', Math.abs(bf.w / bf.h - 1) < 0.04 && bf.w > 250, `${bf.w}x${bf.h}`);
  r = await make({ 'gm-fit': 'fit', 'gm-size': 'largest' }); // back to largest after stretch/fill at first size
  check('output size "largest": 400x400', r.gif.lsd.width === 400 && r.gif.lsd.height === 400, `${r.gif.lsd.width}x${r.gif.lsd.height}`);
  r = await make({ 'gm-size': 'custom', 'gm-w': '200', 'gm-h': '120' });
  check('custom output size 200x120', r.gif.lsd.width === 200 && r.gif.lsd.height === 120, `${r.gif.lsd.width}x${r.gif.lsd.height}`);
  await p.getByLabel('Move frame 3 earlier').click();
  r = await make({ 'gm-size': 'first', 'gm-loops': '3' });
  const mid = (f) => { const i = ((f.dims.height >> 1) * f.dims.width + (f.dims.width >> 1)) * 4; return [f.patch[i], f.patch[i + 1], f.patch[i + 2]]; };
  const order = r.frames.map(mid).map(([rr, g, bb]) => (rr > 200 && g < 80 ? 'red' : g > 120 && rr < 80 ? 'green' : bb > 150 ? 'blue' : '?')).join(',');
  const ns = r.bytes.indexOf(Buffer.from('NETSCAPE2.0')); const loopCount = ns >= 0 ? r.bytes.readUInt16LE(ns + 13) : null;
  check('frame 3 moved earlier: red, green, blue; "3 more times" written as loop count 3', order === 'red,green,blue' && loopCount === 3, `${order} · loop ${loopCount}`);
  await p.close();
}

/* ---------- QR Scanner ---------- */
{
  const p = await ctx.newPage(); await p.goto(origin + '/tools/qr-barcodes-tools/qr-scanner', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Scan with camera' }).click();
  if (!isFx) {
    await p.locator('[data-text]').waitFor({ timeout: 20000 }).catch(() => {});
    const text = await p.locator('[data-text]').textContent().catch(() => null);
    const live = await p.evaluate(() => !!document.querySelector('video')?.srcObject);
    check('camera: the QR code in the video is read, then the camera stops', text === QR_TEXT && !live && (await p.getByRole('button', { name: 'Scan with camera' }).count()) === 1, `${text} · camera still on: ${live}`);
    check('camera result is a link: "Open link" offered, with the warning', (await p.getByRole('link', { name: 'Open link' }).getAttribute('href')) === QR_TEXT);
  } else {
    await p.getByRole('button', { name: 'Stop camera' }).waitFor({ timeout: 20000 });
    await p.waitForTimeout(2000);
    const st = await p.locator('[role=status]').textContent().catch(() => '');
    check('Firefox fake camera: camera starts, keeps scanning, no false read', /Point the camera/.test(st) && (await p.locator('[data-text]').count()) === 0, st);
    await p.getByRole('button', { name: 'Stop camera' }).click();
    check('Stop camera: stream released', await p.evaluate(() => !document.querySelector('video')?.srcObject));
  }
  // drop and paste an image
  const b64 = qrPng.toString('base64');
  await p.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const f = new File([bytes], 'qr.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(f); const z = document.querySelector('[data-dropzone]');
    z.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true })); z.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, b64);
  await p.locator('[data-text]').waitFor({ timeout: 10000 }).catch(() => {});
  check('drop an image on the box: read', (await p.locator('[data-text]').textContent().catch(() => null)) === QR_TEXT);
  await p.evaluate(() => { const r = document.querySelector('[data-result]'); if (r) r.remove(); });
  await p.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bytes], 'shot.png', { type: 'image/png' }));
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, b64);
  await p.locator('[data-text]').waitFor({ timeout: 10000 }).catch(() => {});
  // Firefox empties the DataTransfer of a ClipboardEvent built by a script (checked 26/09/2026): not testable there.
  if (isFx) console.log('SKIP paste an image: Firefox drops the files of a scripted ClipboardEvent');
  else check('paste an image (Ctrl+V): read', (await p.locator('[data-text]').textContent().catch(() => null)) === QR_TEXT);
  await p.locator('input[type=file]').setInputFiles(qrFile);
  await p.locator('[data-text]').waitFor({ timeout: 10000 });
  check('upload still works', (await p.locator('[data-text]').textContent()) === QR_TEXT);
  await p.close();
}
if (!isFx) { // camera refused: says so
  const b2 = await chromium.launch(); const c2 = await b2.newContext(); const p = await c2.newPage();
  await p.goto(origin + '/tools/qr-barcodes-tools/qr-scanner', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Scan with camera' }).click();
  await p.locator('[role=status]').waitFor({ timeout: 15000 });
  const st = await p.locator('[role=status]').textContent();
  check('no camera / refused: a clear message, upload suggested', /refused|No camera/.test(st) && /photo/.test(st), st);
  await b2.close();
}

/* ---------- Audio Trimmer ---------- */
{
  const p = await ctx.newPage(); await p.goto(origin + '/tools/audio-tools/audio-trimmer', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(toneFile);
  await p.locator('#at-end').waitFor();
  check('5.0 s file: end set to 5.0 (not rounded down to whole seconds)', (await p.locator('#at-end').inputValue()) === '5');
  await p.locator('#at-start').fill('1.3'); await p.locator('#at-end').fill('4.7');
  check('kept 3.4 s shown', /Kept: 3\.4 s/.test(await p.locator('[data-length]').textContent()));
  await p.getByRole('button', { name: 'Trim Audio' }).click(); await p.locator('a[download]').waitFor({ timeout: 120000 });
  let d = await dl(p, 'a[download]'); let w = readWav(d.bytes);
  check('no fade: WAV copied, 3.4 s to the sample (1.3 -> 4.7)', d.name === 'trimmed_tone.wav' && Math.abs(w.samples.length / w.rate - 3.4) < 0.001, `${(w.samples.length / w.rate).toFixed(4)} s`);
  { // 24-bit source: cut to the sample, still 24-bit
    const n = 5 * 48000; const b24 = Buffer.alloc(44 + n * 3);
    b24.write('RIFF', 0); b24.writeUInt32LE(36 + n * 3, 4); b24.write('WAVEfmt ', 8); b24.writeUInt32LE(16, 16); b24.writeUInt16LE(1, 20); b24.writeUInt16LE(1, 22);
    b24.writeUInt32LE(48000, 24); b24.writeUInt32LE(48000 * 3, 28); b24.writeUInt16LE(3, 32); b24.writeUInt16LE(24, 34); b24.write('data', 36); b24.writeUInt32LE(n * 3, 40);
    for (let i = 0; i < n; i++) b24.writeIntLE(Math.round(4194304 * Math.sin((2 * Math.PI * 1000 * i) / 48000)), 44 + i * 3, 3);
    const f24 = path.join(tmp, 'tone24.wav'); fs.writeFileSync(f24, b24);
    await p.locator('input[type=file]').setInputFiles(f24); await p.waitForFunction(() => document.querySelector('#at-end')?.value === '5');
    await p.locator('#at-start').fill('0.7'); await p.locator('#at-end').fill('2.2');
    await p.getByRole('button', { name: 'Trim Audio' }).click(); await p.locator('a[download]').waitFor({ timeout: 120000 });
    const o = await dl(p, 'a[download]'); const bits = o.bytes.readUInt16LE(34); const dataAt = o.bytes.indexOf('data'); const secs = o.bytes.readUInt32LE(dataAt + 4) / (48000 * 3);
    check('24-bit WAV, 0.7 -> 2.2 s, no fade: 24-bit kept, 1.5 s to the sample', bits === 24 && Math.abs(secs - 1.5) < 0.0001, `${bits}-bit, ${secs.toFixed(5)} s`);
    await p.locator('input[type=file]').setInputFiles(toneFile); await p.waitForFunction(() => document.querySelector('#at-end')?.value === '5');
    await p.locator('#at-start').fill('1.3'); await p.locator('#at-end').fill('4.7');
  }
  await p.locator('#at-fade-in').fill('1'); await p.locator('#at-fade-out').fill('0.5');
  await p.getByRole('button', { name: 'Trim Audio' }).click(); await p.locator('a[download]').waitFor({ timeout: 120000 });
  d = await dl(p, 'a[download]'); w = readWav(d.bytes); const s = w.samples, R = w.rate, full = rms(s, Math.round(1.5 * R), Math.round(2.5 * R));
  const at = (t) => rms(s, Math.round((t - 0.025) * R), Math.round((t + 0.025) * R)) / full;
  const env = { start: at(0.03), half: at(0.5), afterIn: at(1.2), beforeOut: at(2.85), halfOut: at(3.15), end: at(3.37) };
  check('fade in 1 s, fade out 0.5 s: 3.4 s; silent at the edges, ~half at the fade midpoints, full between', Math.abs(s.length / R - 3.4) < 0.002 && env.start < 0.1 && env.half > 0.4 && env.half < 0.6 && env.afterIn > 0.97 && env.beforeOut > 0.97 && env.halfOut > 0.4 && env.halfOut < 0.6 && env.end < 0.1, JSON.stringify(Object.fromEntries(Object.entries(env).map(([k, v]) => [k, +v.toFixed(2)]))));
  await p.locator('#at-fade-in').fill('3'); await p.locator('#at-fade-out').fill('1');
  await p.getByRole('button', { name: 'Trim Audio' }).click();
  check('fades longer than the part kept: refused, says why', /longer than the part kept/.test(await p.locator('[role=alert]:not(#__next-route-announcer__)').textContent({ timeout: 5000 }).catch(() => '')));
  await p.locator('#at-fade-in').fill('0'); await p.locator('#at-fade-out').fill('0');
  await p.evaluate(() => { document.querySelector('audio').currentTime = 2.5; });
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: "Set to the player's position" }).first().click();
  check('"Set to the player\'s position": start = 2.5', (await p.locator('#at-start').inputValue()) === '2.5');
  await p.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
fs.rmSync(tmp, { recursive: true, force: true });
await b.close(); process.exit(fails ? 1 : 0);
