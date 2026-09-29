// SUPERSEDED on 30/09: Video Merger, Filter, Rotator and Resizer no longer record a <canvas> with MediaRecorder
// (WebM on iPhone, real time, full screen). See scripts/browser-tests/video-tools-mp4.mjs. Kept for history.
// The four canvas + MediaRecorder video tools (Video Merger, Filter, Rotator, Resizer), real pages: a short source
// video is loaded, the tool is run, and the downloaded file is reopened here by ffprobe/ffmpeg -- container matching
// the extension, video stream present with the expected size, duration close to the source, decoded to the end
// without error. Or, when the browser cannot record, the page must say so BEFORE anything runs (role=alert) and keep
// the button disabled. Sources made here with ffmpeg: H.264/AAC MP4 and VP8/Vorbis WebM (engines differ on what they
// can decode; each one is tried).
// Usage: node scripts/browser-tests/mediarecorder-tools.mjs <origin> <ffmpeg> [--browser=firefox|webkit] [--only=rotator]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, ffmpeg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const ffprobe = ffmpeg.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mrec-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

// 3 s, 320x240, moving test pattern + 440 Hz tone
const SRC = {
  mp4: path.join(tmp, 'src.mp4'),
  webm: path.join(tmp, 'src.webm'),
};
const lavfi = ['-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3'];
execFileSync(ffmpeg, ['-y', '-v', 'error', ...lavfi, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', SRC.mp4]);
execFileSync(ffmpeg, ['-y', '-v', 'error', ...lavfi, '-c:v', 'libvpx', '-b:v', '1M', '-c:a', 'libvorbis', '-shortest', SRC.webm]);

function probe(file) {
  const j = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]).toString());
  const v = j.streams.find((s) => s.codec_type === 'video');
  let decodeErrors = '';
  try { decodeErrors = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { decodeErrors = String(e.stderr || e.message); }
  // Duration: MediaRecorder WebM often has no duration in its header; count the decoded frames' last timestamp instead.
  let last = 0;
  try {
    const out = execFileSync(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pts_time,best_effort_timestamp_time', '-of', 'csv=p=0', file]).toString();
    for (const line of out.split('\n')) { const t = Math.max(...line.split(',').map(Number).filter(Number.isFinite)); if (t > last) last = t; }
  } catch { /* reported by decodeErrors */ }
  let audioLevel = null; // mean level of the recorded sound (the sources carry a 440 Hz tone at about -21 dB)
  { const r = spawnSync(ffmpeg, ['-v', 'info', '-i', file, '-map', '0:a:0?', '-af', 'volumedetect', '-f', 'null', '-']); const m = String(r.stderr).match(/mean_volume: (-?[\d.]+) dB/); audioLevel = m ? Number(m[1]) : null; }
  return { audioLevel, format: j.format.format_name, width: v?.width, height: v?.height, codec: v?.codec_name, audio: j.streams.some((s) => s.codec_type === 'audio'), lastFrame: last, decodeErrors: decodeErrors.trim() };
}
const extOk = (ext, format) => (ext === 'webm' ? /webm|matroska/.test(format) : ext === 'mp4' ? /mp4|mov/.test(format) : false);

const TOOLS = [
  { key: 'rotator', path: '/tools/video-tools/video-rotator', button: 'Rotate Video', files: 1, size: [240, 320], prep: async (p) => p.getByRole('button', { name: '90°' }).click() },
  { key: 'filter', path: '/tools/video-tools/video-filter', button: /Apply/, files: 1, size: [320, 240], prep: async (p) => p.getByRole('button', { name: 'Grayscale' }).click() },
  { key: 'resizer', path: '/tools/video-tools/video-resizer', button: 'Resize Video', files: 1, size: [854, 480], prep: async (p) => p.getByRole('button', { name: '480p' }).click() },
  { key: 'merger', path: '/tools/video-tools/video-merger', button: 'Merge Videos', files: 2, size: null, duration: 6, prep: async () => {} },
];

const b = await engine.launch();
for (const kind of ['mp4', 'webm']) {
  for (const t of TOOLS) {
    if (only.length && !only.includes(t.key)) continue;
    const name = `${browserName} ${t.key} (${kind} source)`;
    const ctx = await b.newContext({ acceptDownloads: true });
    const p = await ctx.newPage();
    const pageErrors = []; p.on('pageerror', (e) => pageErrors.push(e.message));
    await p.goto(origin + t.path, { waitUntil: 'networkidle' });
    const support = await p.evaluate(() => ({ mr: typeof MediaRecorder !== 'undefined', types: ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1,mp4a', 'video/mp4'].filter((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)), capture: typeof HTMLCanvasElement.prototype.captureStream === 'function' }));
    const alert = p.locator('p[role=alert]');
    await p.locator('input[type=file]').setInputFiles(Array(t.files).fill(SRC[kind]));
    const vid = p.locator('video').first();
    const readable = await vid.evaluate((v) => new Promise((ok) => { if (v.readyState >= 1) return ok(v.videoWidth > 0); v.onloadedmetadata = () => ok(v.videoWidth > 0); v.onerror = () => ok(false); setTimeout(() => ok(false), 10000); })).catch(() => false);
    if (await alert.count()) {
      const txt = (await alert.first().textContent()) || '';
      const disabled = await p.getByRole('button', { name: t.button }).isDisabled();
      check(`${name}: cannot record -> said before running, button disabled`, disabled && txt.length > 20, `${txt} · support ${JSON.stringify(support)}`);
      await ctx.close(); continue;
    }
    if (!readable && t.key !== 'merger') { console.log('INFO', name, `source not decodable by this engine (${kind}) -- skipped`, JSON.stringify(support)); await ctx.close(); continue; }
    await t.prep(p);
    const timeout = ((t.duration || 3) + 40) * 1000;
    const dlP = p.waitForSelector('a[download]', { timeout }).then(async (a) => { const [d] = await Promise.all([p.waitForEvent('download'), a.click()]); return d; }).catch((e) => e);
    await p.getByRole('button', { name: t.button }).click();
    const d = await dlP;
    if (d instanceof Error) {
      const err = (await alert.count()) ? await alert.first().textContent() : '(no message on the page)';
      check(`${name}: produced a file`, false, `${err} · page errors ${JSON.stringify(pageErrors)} · support ${JSON.stringify(support)}`);
      await ctx.close(); continue;
    }
    const out = path.join(tmp, `${browserName}-${t.key}-${kind}-${d.suggestedFilename()}`);
    await d.saveAs(out);
    const ext = path.extname(out).slice(1);
    let pr; try { pr = probe(out); } catch (e) { check(`${name}: output opens in ffprobe`, false, e.message.slice(0, 200)); await ctx.close(); continue; }
    const want = t.duration || 3;
    check(`${name}: extension .${ext} matches the real container`, extOk(ext, pr.format), pr.format);
    check(`${name}: decodes to the end without error`, !pr.decodeErrors, pr.decodeErrors.slice(0, 200));
    check(`${name}: video ${pr.width}x${pr.height}`, !t.size || (pr.width === t.size[0] && pr.height === t.size[1]), `expected ${t.size}`);
    check(`${name}: duration ${pr.lastFrame.toFixed(2)} s for ${want} s`, Math.abs(pr.lastFrame - want) < 0.7, `codec ${pr.codec}`);
    check(`${name}: the sound is kept`, pr.audio && pr.audioLevel > -40, `audio stream ${pr.audio}, mean level ${pr.audioLevel} dB`);
    if (t.key === 'resizer') { // 4:3 source into 854x480 (16:9): fitted by default, so black bars at the sides
      const px = execFileSync(ffmpeg, ['-v', 'error', '-ss', '1', '-i', out, '-frames:v', '1', '-vf', 'crop=10:10:15:235', '-f', 'rawvideo', '-pix_fmt', 'gray', '-']);
      const edge = px.reduce((a, v) => a + v, 0) / px.length;
      check(`${name}: fitted (black bar at the left edge, not stretched)`, edge < 30, `mean grey ${edge.toFixed(0)}`);
    }
    console.log('INFO', name, JSON.stringify({ size: fs.statSync(out).size, ...pr, decodeErrors: undefined }), 'recorder types', JSON.stringify(support.types));
    await ctx.close();
  }
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);
