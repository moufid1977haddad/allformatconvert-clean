// Video Rotator / Resizer / Filter / Merger (owner's iPhone, 30/09: WebM out, source full screen, real time, heavier
// files). Against the REAL media service started locally (lib/local-media-service.mjs) -- never production. Each
// result is reopened with ffprobe/ffmpeg: container, codecs, displayed size (rotation applied), sound, where a
// marker ends up, bytes untouched for the lossless paths, and whether anything was uploaded.
// Needs: the site run with NEXT_PUBLIC_MEDIA_SERVICE_URL=http://localhost:8621, MEDIA_FFMPEG=<ffmpeg.exe>.
// Usage: node scripts/browser-tests/video-tools-mp4.mjs <origin> [--browser=firefox|webkit] [--only=rotator,resizer,filter,merger]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startLocalMediaService } from './lib/local-media-service.mjs';

const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const engine = arg('browser') === 'firefox' ? firefox : arg('browser') === 'webkit' ? webkit : chromium;
const only = arg('only')?.split(',');
const FF = process.env.MEDIA_FFMPEG;
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-tools-'));
const ff = (...a) => execFileSync(FF, ['-y', '-v', 'error', ...a]);
const probe = (p) => JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p]).toString());
const shown = (p) => { // size as displayed, from a frame decoded with rotation applied
  const s = probe(p).streams.find((x) => x.codec_type === 'video');
  const rot = Math.abs(Number((s.side_data_list || []).find((d) => 'rotation' in d)?.rotation || 0)) % 180;
  return rot === 90 ? [s.height, s.width] : [s.width, s.height];
};
const rgbAt = (p, fx, fy) => { // pixel of the first frame as displayed, at a fraction of the size
  const [w, h] = shown(p);
  const raw = execFileSync(FF, ['-v', 'error', '-i', p, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  const x = Math.floor(w * fx), y = Math.floor(h * fy), i = (y * w + x) * 3;
  return [raw[i], raw[i + 1], raw[i + 2]];
};
const isRed = ([r, g, b]) => r > 170 && g < 90 && b < 90;

// Fixtures: 640x360 H.264/AAC, a red marker on the stored top-left quarter
const base = ['-f', 'lavfi', '-i', 'color=c=0x2060A0:s=640x360:r=30:d=3', '-f', 'lavfi', '-i', 'sine=f=440:d=3', '-vf', 'drawbox=x=0:y=0:w=320:h=180:color=red:t=fill'];
const plain = path.join(dir, 'plain.mp4'); ff(...base, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', plain);
const phone = path.join(dir, 'IMG_0001.MOV'); ff('-display_rotation:v:0', '-90', '-i', plain, '-c', 'copy', '-f', 'mov', phone); // shown 360x640, marker top-right
const webm = path.join(dir, 'clip.webm'); ff(...base, '-c:v', 'libvpx-vp9', '-b:v', '300k', '-c:a', 'libopus', '-shortest', webm);
const other = path.join(dir, 'second.mp4'); ff('-f', 'lavfi', '-i', 'testsrc=s=480x270:r=25:d=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', other); // silent, other size/rate

const svc = await startLocalMediaService({ origin });
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

async function tool(url, files, act, { timeout = 300000 } = {}) {
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, hasTouch: true });
  await svc.routeTickets(ctx);
  const before = svc.jobs.length;
  const page = await ctx.newPage();
  const fullscreen = [];
  page.on('console', (m) => { if (m.text().startsWith('FULLSCREEN')) fullscreen.push(m.text()); });
  await page.addInitScript(() => { document.addEventListener('fullscreenchange', () => console.log('FULLSCREEN ' + !!document.fullscreenElement), true); });
  await page.goto(origin + url, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(files);
  const t0 = Date.now();
  await act(page);
  const link = page.locator('a[download]').filter({ hasText: /Download/ }).last();
  const err = page.locator('p[role=alert]').filter({ hasText: /\S/ });
  await Promise.race([link.waitFor({ timeout }), err.first().waitFor({ timeout })]);
  if (!(await link.count())) { const e = await err.first().innerText(); await ctx.close(); return { error: e || 'error' }; }
  const secs = (Date.now() - t0) / 1000;
  const noInline = await page.$$eval('video', (vs) => vs.filter((v) => !v.hasAttribute('playsinline')).length);
  const [d] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const out = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out);
  const text = await page.locator('body').innerText();
  await ctx.close();
  return { out, name: d.suggestedFilename(), secs, uploads: svc.jobs.length - before, noInline, fullscreen, text };
}
const codecs = (p) => probe(p).streams.map((s) => `${s.codec_type}:${s.codec_name}`).sort().join(',');
const dur = (p) => Number(probe(p).format.duration);
const run = (k) => !only || only.includes(k);

try {
  if (run('rotator')) {
    let r = await tool('/tools/video-tools/video-rotator', plain, async (p) => { await p.getByRole('button', { name: /^90°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
    if (r.error) check('rotator MP4 90°', false, r.error); else {
      const a = fs.readFileSync(plain), o = fs.readFileSync(r.out); let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== o[i]) diff++;
      check('rotator MP4 90°: instant, lossless, nothing uploaded', r.uploads === 0 && o.length === a.length && diff > 0 && diff <= 36 && r.name === 'plain-rotated.mp4', `${r.secs.toFixed(1)} s, ${diff} bytes changed of ${a.length}, uploads ${r.uploads}, ${r.name}`);
      check('rotator MP4 90°: shown 360x640, marker top-right, sound kept', shown(r.out).join('x') === '360x640' && isRed(rgbAt(r.out, 0.9, 0.1)) && !isRed(rgbAt(r.out, 0.1, 0.1)) && codecs(r.out) === 'audio:aac,video:h264', `${shown(r.out).join('x')} ${codecs(r.out)}`);
    }
    r = await tool('/tools/video-tools/video-rotator', phone, async (p) => { await p.getByRole('button', { name: /^90°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
    if (r.error) check('rotator iPhone MOV (already portrait) + 90°', false, r.error);
    else check('rotator iPhone MOV (portrait) + 90° -> 180°: MOV kept, 640x360 shown, marker bottom-right, nothing uploaded', r.uploads === 0 && r.name === 'IMG_0001-rotated.mov' && shown(r.out).join('x') === '640x360' && isRed(rgbAt(r.out, 0.9, 0.9)) && fs.statSync(r.out).size === fs.statSync(phone).size, `${shown(r.out).join('x')} ${r.name}`);
    r = await tool('/tools/video-tools/video-rotator', webm, async (p) => { await p.getByRole('button', { name: /^270°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
    if (r.error) check('rotator WebM 270° (service)', false, r.error);
    else check('rotator WebM 270°: MP4 H.264/AAC from the service, 360x640, marker bottom-left', r.uploads === 1 && r.name === 'clip-rotated.mp4' && codecs(r.out) === 'audio:aac,video:h264' && shown(r.out).join('x') === '360x640' && isRed(rgbAt(r.out, 0.1, 0.9)), `${codecs(r.out)} ${shown(r.out).join('x')} ${r.secs.toFixed(1)} s`);
  }
  if (run('resizer')) {
    const r = await tool('/tools/video-tools/video-resizer', phone, async (p) => { await p.getByRole('button', { name: '720p' }).click(); await p.getByRole('button', { name: 'Resize Video' }).click(); });
    if (r.error) check('resizer', false, r.error);
    else check('resizer iPhone portrait MOV -> 720p Fit: MP4 1280x720, bars left/right, sound, ~3 s', r.name === 'IMG_0001-1280x720.mp4' && codecs(r.out) === 'audio:aac,video:h264' && shown(r.out).join('x') === '1280x720' && Math.max(...rgbAt(r.out, 0.05, 0.5)) < 30 && Math.abs(dur(r.out) - 3) < 0.15 && r.noInline === 0,
      `${codecs(r.out)} ${shown(r.out).join('x')} ${dur(r.out).toFixed(2)} s, ${r.secs.toFixed(1)} s, videos without playsinline: ${r.noInline}`);
  }
  if (run('filter')) {
    const r = await tool('/tools/video-tools/video-filter', plain, async (p) => { await p.getByRole('radio', { name: 'Grayscale' }).click(); await p.getByRole('button', { name: 'Apply Filter' }).click(); });
    if (r.error) check('filter', false, r.error);
    else { const px = rgbAt(r.out, 0.1, 0.1); check('filter Grayscale: MP4, red marker became grey (Rec. 709 ~54), sound kept', r.name === 'plain-grayscale.mp4' && codecs(r.out) === 'audio:aac,video:h264' && Math.max(...px) - Math.min(...px) < 8 && Math.abs(px[0] - 54) < 12, `${px} ${codecs(r.out)} ${r.secs.toFixed(1)} s`); }
  }
  if (run('merger')) {
    // same clips twice: joined without re-encoding, nothing uploaded
    let r = await tool('/tools/video-tools/video-merger', [plain, plain], async (p) => { await p.getByRole('button', { name: /Merge Videos/ }).click(); });
    if (r.error) check('merger identical clips', false, r.error);
    else check('merger 2 identical MP4: joined by copy (nothing uploaded), 6 s, H.264/AAC MP4', r.uploads === 0 && /\.mp4$/.test(r.name) && codecs(r.out) === 'audio:aac,video:h264' && Math.abs(dur(r.out) - 6) < 0.15, `${r.name} ${dur(r.out).toFixed(2)} s, uploads ${r.uploads}, ${r.secs.toFixed(1)} s`);
    // different sizes, rates, one without sound: each clip normalised on the service, then joined by copy
    r = await tool('/tools/video-tools/video-merger', [phone, other, webm], async (p) => { await p.getByRole('button', { name: /Merge Videos/ }).click(); });
    if (r.error) check('merger mixed clips', false, r.error);
    else {
      const dec = (() => { try { execFileSync(FF, ['-v', 'error', '-i', r.out, '-f', 'null', '-']); return true; } catch { return false; } })();
      check('merger portrait MOV + silent 480x270 25 fps + WebM: one MP4, 360x640 like the first, 8 s, sound, decodes to the end', r.uploads === 3 && codecs(r.out) === 'audio:aac,video:h264' && shown(r.out).join('x') === '360x640' && Math.abs(dur(r.out) - 8) < 0.3 && dec,
        `${shown(r.out).join('x')} ${dur(r.out).toFixed(2)} s, uploads ${r.uploads}, ${r.secs.toFixed(1)} s`);
    }
  }
} finally {
  await b.close(); svc.stop();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
