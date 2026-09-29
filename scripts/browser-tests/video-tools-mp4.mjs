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
const tall = path.join(dir, 'vertical.mp4'); ff('-f', 'lavfi', '-i', 'color=c=0x2060A0:s=540x960:r=30:d=3', '-f', 'lavfi', '-i', 'sine=f=440:d=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', tall); // stored vertical, no rotation
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
// 30/09 (real Safari 17.6 on the Mac, old MediaRecorder path): outputs ~20 fps and longer than the source (Rotator
// 8.29 s for 5 s, Merger 16.63 s for 10 s, Resizer 6.69 s for 5 s). Every result is now held to the source's frame
// rate, its exact number of frames, and a sound track as long as the picture.
const timing = (p) => {
  const j = JSON.parse(execFileSync(FP, ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,r_frame_rate,duration,nb_read_frames', '-of', 'json', p]).toString());
  const v = j.streams.find((x) => x.codec_type === 'video'), a = j.streams.find((x) => x.codec_type === 'audio');
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  return { fps: n / (d || 1), frames: Number(v.nb_read_frames), vdur: Number(v.duration), adur: a ? Number(a.duration) : null };
};
const exact = (p, fps, frames, secs) => {
  const t = timing(p);
  return { ok: Math.abs(t.fps - fps) < 0.01 && t.frames === frames && Math.abs(t.vdur - secs) <= 0.001 + 1 / fps / 2 && (t.adur === null || Math.abs(t.adur - secs) <= 0.05),
    info: `${t.fps} fps, ${t.frames} frames (${frames} expected), video ${t.vdur.toFixed(3)} s, sound ${t.adur === null ? 'none' : t.adur.toFixed(3) + ' s'} for ${secs} s` };
};
const checkTiming = (name, p, fps, frames, secs) => { const e = exact(p, fps, frames, secs); check(`${name}: ${fps} fps, ${frames} frames, ${secs} s, sound as long`, e.ok, e.info); };
const dur = (p) => Number(probe(p).format.duration);
const run = (k) => !only || only.includes(k);

try {
  if (run('rotator')) {
    let r = await tool('/tools/video-tools/video-rotator', plain, async (p) => { await p.getByRole('button', { name: /^90°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
    if (r.error) check('rotator MP4 90°', false, r.error); else {
      const a = fs.readFileSync(plain), o = fs.readFileSync(r.out); let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== o[i]) diff++;
      check('rotator MP4 90°: instant, lossless, nothing uploaded', r.uploads === 0 && o.length === a.length && diff > 0 && diff <= 36 && r.name === 'plain-rotated.mp4', `${r.secs.toFixed(1)} s, ${diff} bytes changed of ${a.length}, uploads ${r.uploads}, ${r.name}`);
      checkTiming('rotator MP4 90° (lossless)', r.out, 30, 90, 3);
      check('rotator MP4 90°: shown 360x640, marker top-right, sound kept', shown(r.out).join('x') === '360x640' && isRed(rgbAt(r.out, 0.9, 0.1)) && !isRed(rgbAt(r.out, 0.1, 0.1)) && codecs(r.out) === 'audio:aac,video:h264', `${shown(r.out).join('x')} ${codecs(r.out)}`);
    }
    r = await tool('/tools/video-tools/video-rotator', phone, async (p) => { await p.getByRole('button', { name: /^90°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
    if (r.error) check('rotator iPhone MOV (already portrait) + 90°', false, r.error);
    else { check('rotator iPhone MOV (portrait) + 90° -> 180°: MOV kept, 640x360 shown, marker bottom-right, nothing uploaded', r.uploads === 0 && r.name === 'IMG_0001-rotated.mov' && shown(r.out).join('x') === '640x360' && isRed(rgbAt(r.out, 0.9, 0.9)) && fs.statSync(r.out).size === fs.statSync(phone).size, `${shown(r.out).join('x')} ${r.name}`); checkTiming('rotator iPhone MOV', r.out, 30, 90, 3); }
    r = await tool('/tools/video-tools/video-rotator', webm, async (p) => { await p.getByRole('button', { name: /^270°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
    if (r.error) check('rotator WebM 270° (service)', false, r.error);
    else { check('rotator WebM 270°: MP4 H.264/AAC from the service, 360x640, marker bottom-left', r.uploads === 1 && r.name === 'clip-rotated.mp4' && codecs(r.out) === 'audio:aac,video:h264' && shown(r.out).join('x') === '360x640' && isRed(rgbAt(r.out, 0.1, 0.9)), `${codecs(r.out)} ${shown(r.out).join('x')} ${r.secs.toFixed(1)} s`); checkTiming('rotator WebM (service)', r.out, 30, 90, 3); }
  }
  if (run('resizer')) {
    // The Safari case (30/09): "480p" on a vertical video must stay vertical, 480x854 -- not a landscape 854x480.
    for (const [label, file, preset, want, name] of [
      ['iPhone portrait MOV (rotation flag) -> 480p', phone, '480p', '480x854', 'IMG_0001-480x854.mp4'],
      ['stored-vertical MP4 -> 720p', tall, '720p', '720x1280', 'vertical-720x1280.mp4'],
      ['landscape MP4 -> 480p', plain, '480p', '854x480', 'plain-854x480.mp4'],
    ]) {
      let unread = false;
      const r = await tool('/tools/video-tools/video-resizer', file, async (p) => {
        // Playwright's WebKit on Windows decodes no video at all (a real Safari does): the page cannot read the
        // video's shape there, and says nothing about it -- presets stay landscape. Reported, not hidden.
        unread = !(await p.getByText(/^Your video: /).waitFor({ timeout: 20000 }).then(() => true, () => false));
        await p.getByRole('button', { name: preset, exact: true }).click(); await p.getByRole('button', { name: 'Resize Video' }).click();
      });
      if (r.error) { check(`resizer ${label}`, false, r.error); continue; }
      if (unread && engine === webkit && want !== '854x480') { console.log(`SKIP resizer ${label}: this WebKit reads no video, so the page cannot know it is vertical (real Safari: to verify)`); continue; }
      check(`resizer ${label}: MP4 ${want}, orientation kept, sound, playsinline`, r.name === name && codecs(r.out) === 'audio:aac,video:h264' && shown(r.out).join('x') === want && r.noInline === 0,
        `${r.name} ${codecs(r.out)} ${shown(r.out).join('x')}, ${r.secs.toFixed(1)} s, videos without playsinline: ${r.noInline}`);
      checkTiming(`resizer ${label}`, r.out, 30, 90, 3);
    }
    // Default size for a vertical video: the vertical 720p, never a landscape size
    const r = engine === webkit ? { skip: true } : await tool('/tools/video-tools/video-resizer', tall, async (p) => { await p.getByText(/^Your video: 540×960 \(vertical\)/).waitFor({ timeout: 30000 }); await p.getByRole('button', { name: 'Resize Video' }).click(); });
    if (r.skip) console.log('SKIP resizer default on a vertical video: this WebKit reads no video');
    else if (r.error) check('resizer default on a vertical video', false, r.error);
    else check('resizer default on a vertical video: 720x1280', shown(r.out).join('x') === '720x1280', shown(r.out).join('x'));
  }
  if (run('filter')) {
    const r = await tool('/tools/video-tools/video-filter', plain, async (p) => { await p.getByRole('radio', { name: 'Grayscale' }).click(); await p.getByRole('button', { name: 'Apply Filter' }).click(); });
    if (r.error) check('filter', false, r.error);
    else { const px = rgbAt(r.out, 0.1, 0.1); check('filter Grayscale: MP4, red marker became grey (Rec. 709 ~54), sound kept', r.name === 'plain-grayscale.mp4' && codecs(r.out) === 'audio:aac,video:h264' && Math.max(...px) - Math.min(...px) < 8 && Math.abs(px[0] - 54) < 12, `${px} ${codecs(r.out)} ${r.secs.toFixed(1)} s`); checkTiming('filter Grayscale', r.out, 30, 90, 3); }
  }
  if (run('merger')) {
    // same clips twice: joined without re-encoding, nothing uploaded
    let r = await tool('/tools/video-tools/video-merger', [plain, plain], async (p) => { await p.getByRole('button', { name: /Merge Videos/ }).click(); });
    if (r.error) check('merger identical clips', false, r.error);
    else { check('merger 2 identical MP4: joined by copy (nothing uploaded), 6 s, H.264/AAC MP4', r.uploads === 0 && /\.mp4$/.test(r.name) && codecs(r.out) === 'audio:aac,video:h264' && Math.abs(dur(r.out) - 6) < 0.15, `${r.name} ${dur(r.out).toFixed(2)} s, uploads ${r.uploads}, ${r.secs.toFixed(1)} s`); checkTiming('merger identical clips', r.out, 30, 180, 6); }
    // different sizes, rates, one without sound: each clip normalised on the service, then joined by copy
    r = await tool('/tools/video-tools/video-merger', [phone, other, webm], async (p) => { await p.getByRole('button', { name: /Merge Videos/ }).click(); });
    if (r.error) check('merger mixed clips', false, r.error);
    else {
      const dec = (() => { try { execFileSync(FF, ['-v', 'error', '-i', r.out, '-f', 'null', '-']); return true; } catch { return false; } })();
      check('merger portrait MOV + silent 480x270 25 fps + WebM: one MP4, 360x640 like the first, 8 s, sound, decodes to the end', r.uploads === 3 && codecs(r.out) === 'audio:aac,video:h264' && shown(r.out).join('x') === '360x640' && Math.abs(dur(r.out) - 8) < 0.3 && dec,
        `${shown(r.out).join('x')} ${dur(r.out).toFixed(2)} s, uploads ${r.uploads}, ${r.secs.toFixed(1)} s`);
      checkTiming("merger mixed clips (3 s + 2 s at 25 fps + 3 s -> the first clip's 30 fps)", r.out, 30, 240, 8);
    }
  }
} finally {
  await b.close(); svc.stop();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
