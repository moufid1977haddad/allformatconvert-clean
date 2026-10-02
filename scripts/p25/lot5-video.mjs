// P25 (03/10), lot 5: the E5 video options, used as a visitor, through the REAL media service; every result is
// downloaded and measured with ffmpeg/ffprobe (MEDIA_FFMPEG_PATH: a local ffmpeg with ffprobe next to it).
// Usage: node scripts/p25/lot5-video.mjs <origin> [--browser=chromium|firefox] [--cors-shim] [--only=a,b]
//   --cors-shim: on a preview behind the local relay, the service's CORS answer is added by Playwright (as P24).
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
const want = (k) => !only || only.includes(k);
const FF = process.env.MEDIA_FFMPEG_PATH;
if (!FF) { console.error('MEDIA_FFMPEG_PATH is required'); process.exit(2); }
const FP = path.join(path.dirname(FF), 'ffprobe' + (FF.endsWith('.exe') ? '.exe' : ''));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p25-video-'));
// 320x240, 30 fps, 4 s: top-left quarter red, the rest blue; a 440 Hz tone at -12 dBFS
const src = path.join(dir, 'clip.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x0000FF:s=320x240:r=30:d=4', '-f', 'lavfi', '-i', 'sine=f=440:d=4:sample_rate=48000',
  '-vf', 'drawbox=x=0:y=0:w=160:h=120:color=red:t=fill', '-af', 'volume=0.25', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', src]);
// A detailed, high-bitrate clip for the compressor (a flat one is already smaller than any compression: the page then
// says "not smaller", honestly)
const rich = path.join(dir, 'rich.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=4,noise=alls=6:allf=t', '-f', 'lavfi', '-i', 'sine=f=440:d=4',
  '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', rich]);
const probe = (f) => JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], { encoding: 'utf8' }));
const vstream = (f) => probe(f).streams.find((s) => s.codec_type === 'video');
const astream = (f) => probe(f).streams.find((s) => s.codec_type === 'audio');
const pixel = (f, x, y) => { const s = vstream(f); const raw = execFileSync(FF, ['-v', 'error', '-i', f, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']); const i = (y * s.width + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]]; };
const red = (c) => c[0] > 180 && c[2] < 80;

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.route(/vercel\.live/, (r) => r.abort());
if (process.argv.includes('--cors-shim')) {
  const SERVICE = 'https://media-processing-production-d2f4.up.railway.app';
  await ctx.route(SERVICE + '/**', async (r) => {
    const req = r.request();
    const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS' };
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    const resp = await r.fetch();
    return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
  });
}
async function run(slug, setup, button, label, file = src) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/video-tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.waitForTimeout(1200);
  await setup(p);
  await p.getByRole('button', { name: button }).first().click();
  const link = p.locator('a[data-download]').first();
  const ok = await Promise.race([link.waitFor({ timeout: 240000 }).then(() => true), p.locator('p[role=alert]').first().waitFor({ timeout: 240000 }).then(() => false)]).catch(() => false);
  if (!ok) { const msg = await p.locator('p[role=alert]').first().innerText().catch(() => 'timeout'); check(label, false, msg); await p.close(); return null; }
  const dl = p.waitForEvent('download', { timeout: 60000 });
  await link.click();
  const d = await dl;
  const out = path.join(dir, `${slug}-${Date.now()}.mp4`);
  await d.saveAs(out);
  await p.close();
  return { out, name: d.suggestedFilename() };
}

if (want('mirror')) {
  const r = await run('video-rotator', async (p) => { await p.getByRole('button', { name: 'No rotation' }).click(); await p.getByRole('radio', { name: /Mirror ⇆/ }).click(); }, 'Rotate Video', 'rotator: mirror only');
  if (r) check('rotator: mirror only — the red quarter moves to the top right, named -mirrored', red(pixel(r.out, 300, 20)) && !red(pixel(r.out, 20, 20)) && /-mirrored\.mp4$/.test(r.name), `${pixel(r.out, 300, 20)} ${r.name}`);
}
if (want('crop')) {
  const r = await run('video-resizer', async (p) => {
    await p.getByRole('radio', { name: 'Crop' }).click();
    for (const [k, v] of [['x', 0], ['y', 0], ['w', 160], ['h', 120]]) { const f = p.locator(`[data-crop="${k}"]`); await f.fill(String(v)); await f.blur(); }
  }, 'Resize Video', 'resizer: crop');
  if (r) { const s = vstream(r.out); check('resizer: crop 160×120 of the top left — that size, all red, sound kept', s.width === 160 && s.height === 120 && red(pixel(r.out, 80, 60)) && !!astream(r.out), `${s.width}x${s.height} ${r.name}`); }
}
if (want('speed')) {
  const r = await run('video-converter', async (p) => {
    await p.locator('[data-advanced] summary').click();
    await p.locator('#vc-speed').selectOption('2'); await p.locator('#vc-volume').fill('50');
    await p.locator('#vc-fadein').fill('0.5');
  }, 'Convert', 'converter: speed 2×, volume 50 %, fade in');
  if (r) { const v = vstream(r.out), a = astream(r.out); check('converter: 2× → video and sound 2 s, 30 fps', Math.abs(Number(v.duration) - 2) < 0.15 && Math.abs(Number(a.duration) - 2) < 0.15 && Math.abs(eval(v.avg_frame_rate) - 30) < 1, `v ${v.duration} a ${a.duration} ${v.avg_frame_rate}`); }
}
if (want('codec')) {
  const r = await run('video-compressor', async (p) => { await p.locator('#vcomp-codec').selectOption('h265'); }, 'Compress Video', 'compressor: H.265', rich);
  if (r) { const v = vstream(r.out); check('compressor: H.265 chosen → HEVC (hvc1), named -h265-compressed', v.codec_name === 'hevc' && v.codec_tag_string === 'hvc1' && /-h265-compressed\.mp4$/.test(r.name), `${v.codec_name} ${v.codec_tag_string} ${r.name}`); }
  const r2 = await run('video-converter', async (p) => { await p.getByLabel('Convert to').selectOption('av1'); await p.locator('[data-advanced] summary').click(); await p.locator('#vc-flip').selectOption('v'); }, 'Convert', 'converter: AV1 + vertical mirror');
  if (r2) { const v = vstream(r2.out); check('converter: AV1 + top-bottom mirror → AV1, red at the bottom left, named -av1', v.codec_name === 'av1' && red(pixel(r2.out, 20, 220)) && /-av1\.mp4$/.test(r2.name), `${v.codec_name} ${r2.name}`); }
}
await b.close();
console.log(`${name}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
