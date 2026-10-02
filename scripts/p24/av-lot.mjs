// P24 (03/10), audio / video lot (the options that run in the browser): each result reopened and measured in Node
// (WAV / MP3 headers, samples) or decoded by the browser (a video frame).
// Usage: node scripts/p24/av-lot.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar] [--only=a,b]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const name = arg('browser') || 'chromium';
const only = (arg('only') || '').split(',').filter(Boolean);
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const tone = path.join(ROOT, 'docs', 'audit', 'fixtures-safari', 'safari-tone-B-3s.mp3');
// Playwright's WebKit for Windows has no H.264 decoder (Safari has one): there the WebM fixture is the input, and the
// MP4 made from it is checked by its structure (H.264 track) — its pixels are checked in Chromium and Firefox.
const video = path.join(ROOT, 'scripts', 'audit', 'fixtures', 'files', name === 'webkit' ? 'sample.webm' : 'sample.mp4');

const wavInfo = (b) => { // RIFF/WAVE fmt chunk
  let i = 12; while (i + 8 <= b.length) { const id = b.toString('latin1', i, i + 4), len = b.readUInt32LE(i + 4); if (id === 'fmt ') return { channels: b.readUInt16LE(i + 10), rate: b.readUInt32LE(i + 12), bits: b.readUInt16LE(i + 22), dataAt: null }; i += 8 + len + (len & 1); } return null;
};
const wavSamples = (b) => { let i = 12; while (i + 8 <= b.length) { const id = b.toString('latin1', i, i + 4), len = b.readUInt32LE(i + 4); if (id === 'data') { const n = Math.floor(Math.min(len, b.length - i - 8) / 2), s = new Int16Array(n); for (let k = 0; k < n; k++) s[k] = b.readInt16LE(i + 8 + k * 2); return s; } i += 8 + len + (len & 1); } return new Int16Array(0); };
const rms = (s) => Math.sqrt(s.reduce((a, v) => a + v * v, 0) / Math.max(1, s.length));
const peak = (s) => s.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
const mp3Info = (b) => { // first MPEG audio frame after an ID3 tag
  let i = 0; if (b.toString('latin1', 0, 3) === 'ID3') i = 10 + ((b[6] & 127) << 21 | (b[7] & 127) << 14 | (b[8] & 127) << 7 | (b[9] & 127));
  for (; i + 4 < b.length; i++) if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) {
    const ver = (b[i + 1] >> 3) & 3, sr = (b[i + 2] >> 2) & 3, mode = (b[i + 3] >> 6) & 3;
    const base = [44100, 48000, 32000][sr]; const rate = ver === 3 ? base : ver === 2 ? base / 2 : base / 4;
    return { rate, mono: mode === 3 };
  }
  return null;
};

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
async function open(slug) { const p = await ctx.newPage(); await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(800); return p; }
// waits for a NEW result: the link of the previous run, if any, must have changed
let lastHref = new WeakMap();
async function result(p, timeout = 180000) {
  const prev = lastHref.get(p);
  const ok = await p.waitForFunction((old) => { const a = document.querySelector('[data-file-download] [data-download]'); return a && a.getAttribute('href') !== old; }, prev || null, { timeout }).then(() => true).catch(() => false);
  if (ok) lastHref.set(p, await p.locator('[data-file-download] [data-download]').first().getAttribute('href'));
  if (!ok) return { alert: (await p.locator('main').innerText()).slice(0, 300) };
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
    const u = new Uint8Array(await res.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
  });
  return { bytes: Buffer.from(b64, 'base64') };
}
// Playwright's WebKit for Windows decodes no video at all (neither H.264 nor WebM; Safari does): the video checks run in
// Chromium and Firefox, and are reported as not measurable here.
const want = (k) => (!only.length || only.includes(k)) && !(name === 'webkit' && ['screenshot', 'watermark'].includes(k) && (console.log(`SKIP ${name} ${k}: this test browser decodes no video`), true));

if (want('converter')) {
  const p = await open('audio-tools/audio-converter');
  await p.locator('input[type=file]').first().setInputFiles(tone);
  await p.getByLabel('Target Format').selectOption('wav');
  await p.locator('#ac-rate').selectOption('16000');
  await p.locator('#ac-channels').selectOption('1');
  await p.getByRole('button', { name: /^Convert/ }).click();
  const r = await result(p);
  const info = r.bytes && wavInfo(r.bytes);
  check('audio-converter: WAV at 16 kHz mono', !!info && info.rate === 16000 && info.channels === 1, info ? JSON.stringify(info) : r.alert);
  await p.getByLabel('Target Format').selectOption('ac3');
  await p.getByRole('button', { name: /^Convert/ }).click();
  const r2 = await p.locator('main').getByText(/cannot be written at 16 kHz/).first().waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
  check('audio-converter: AC3 at 16 kHz is refused with a sentence, not resampled silently', r2);
  await p.close();
}

if (want('compressor')) {
  const p = await open('audio-tools/audio-compressor');
  await p.locator('input[type=file]').first().setInputFiles(tone);
  await p.locator('#acp-mono').check();
  await p.locator('#acp-rate').selectOption('22050');
  await p.getByRole('button', { name: /^Compress/ }).click();
  const r = await result(p);
  const info = r.bytes && mp3Info(r.bytes);
  check('audio-compressor: MP3 mono at 22.05 kHz', !!info && info.mono && info.rate === 22050, info ? JSON.stringify(info) : (r.alert || '').slice(0, 160));
  await p.close();
}

if (want('booster')) {
  const p = await open('audio-tools/audio-booster');
  await p.locator('input[type=file]').first().setInputFiles(tone);
  await p.getByLabel('Output Format').selectOption('wav');
  await p.getByLabel('Volume Boost').fill('1');
  await p.getByRole('button', { name: /Boost|Apply|Process/ }).first().click();
  const ref = await result(p);
  await p.getByLabel('Volume Boost').fill('0.5');
  await p.getByRole('button', { name: /Boost|Apply|Process/ }).first().click();
  await p.waitForTimeout(500);
  const half = await result(p);
  const a = ref.bytes && rms(wavSamples(ref.bytes)), c = half.bytes && rms(wavSamples(half.bytes));
  check('audio-booster: 0.5× halves the level (RMS ratio 0.5 ± 0.03)', a && c && Math.abs(c / a - 0.5) < 0.03, `${a?.toFixed(0)} → ${c?.toFixed(0)}`);
  await p.locator('#ab-normalize').check();
  await p.getByRole('button', { name: /Boost|Apply|Process/ }).first().click();
  await p.waitForTimeout(500);
  const norm = await result(p);
  const s = norm.bytes && wavSamples(norm.bytes);
  const pk = s ? 20 * Math.log10(peak(s) / 32768) : 0;
  check('audio-booster: normalize keeps the true peak at or under -1.5 dBFS and changes the level', !!s && pk <= -1.2 && Math.abs(rms(s) - a) / a > 0.05, `peak ${pk.toFixed(2)} dBFS, rms ${s ? rms(s).toFixed(0) : '-'} vs ${a?.toFixed(0)}`);
  await p.close();
}

if (want('screenshot')) {
  const p = await open('video-tools/video-screenshot');
  await p.locator('input[type=file]').first().setInputFiles(video);
  await p.waitForTimeout(2000);
  await p.getByLabel('Format').selectOption('webp');
  await p.locator('#shot-time').fill('1.5');
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Capture Screenshot' }).click();
  const r = await result(p, 30000);
  const name = await p.locator('[data-file-download]').first().getAttribute('data-name').catch(() => '');
  check('video-screenshot: a WebP frame at 1.5 s', !!r.bytes && r.bytes.toString('latin1', 8, 12) === 'WEBP' && /1\.50s\.webp$/.test(name || ''), `${r.bytes?.toString('latin1', 8, 12)} ${name} ${r.alert ? r.alert.slice(0, 120) : ''}`);
  await p.close();
}

if (want('watermark')) {
  const p = await open('video-tools/video-watermark');
  await p.locator('input[type=file]').first().setInputFiles(video);
  await p.waitForTimeout(3000);
  await p.getByLabel('Watermark Text').fill('MARK');
  await p.locator('#vwm-size').fill('50');
  await p.locator('#vwm-color').fill('#ff0000');
  await p.getByRole('button', { name: 'center', exact: true }).click();
  await p.getByRole('button', { name: /Add Watermark|Watermark Video|Apply/ }).first().click();
  const r = await result(p, 400000);
  if (r.bytes && process.env.SAVE) fs.writeFileSync(process.env.SAVE, r.bytes);
  if (!r.bytes) check('video-watermark', false, (r.alert || '').slice(0, 160)); else {
    if (name === 'webkit') { check('video-watermark: an H.264 MP4 is made (WebKit for Windows cannot decode it to look at the pixels)', r.bytes.includes(Buffer.from('avc1')) && r.bytes.length > 10000, `${r.bytes.length} B`); await p.close(); await b.close(); console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`); process.exit(fails ? 1 : 0); }
    // a frame of the result, captured by our own Video Screenshot as a PNG (works in every engine), then red pixels counted
    const os = await import('node:os'); const sharp = (await import('sharp')).default;
    const tmp = path.join(os.tmpdir(), `p24-wm-${name}.mp4`); fs.writeFileSync(tmp, r.bytes);
    const q = await open('video-tools/video-screenshot');
    await q.locator('input[type=file]').first().setInputFiles(tmp);
    await q.waitForTimeout(2500);
    await q.locator('#shot-time').fill('0.5'); await q.waitForTimeout(1500);
    await q.getByRole('button', { name: 'Capture Screenshot' }).click();
    const shot = await result(q, 30000);
    let red = { err: shot.alert };
    if (shot.bytes) {
      const img = sharp(shot.bytes); const m = await img.metadata();
      const d = await sharp(shot.bytes).extract({ left: Math.round(m.width * 0.25), top: Math.round(m.height * 0.4), width: Math.round(m.width * 0.5), height: Math.round(m.height * 0.2) }).removeAlpha().raw().toBuffer();
      let n = 0; for (let i = 0; i < d.length; i += 3) if (d[i] > 180 && d[i + 1] < 80 && d[i + 2] < 80) n++;
      red = { n, w: m.width };
    }
    await q.close();
    check('video-watermark: a red text, half the width, in the centre of the frame', red.n > 500, JSON.stringify(red));
  }
  await p.close();
}

await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
