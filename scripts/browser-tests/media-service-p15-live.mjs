// P15 (30/09): the media service ONLINE, reached the way a visitor's browser reaches it (a one-job ticket from the
// site's /api/media/ticket, chunks, start, poll, result). One call per NEW function, each only the new code can pass:
//  1. rotate 90 (Video Rotator, formats without a rotation field) -- an old service ignores "rotate": 640x360 back;
//  2. fit 480x854 of a vertical video (Video Resizer 480p vertical);
//  3. two different clips normalised for a join (Video Merger: fit + fps + forConcat), then joined here by copy as the
//     page does: picture and sound of each part equally long, the joined video has no gap (the 30/09 fix);
//  4. precise cut 1 s -> 5 s of the MKV piece Video Trimmer sends: 120 frames, first frame n° 30 (old: 119, n° 32);
// and the CURRENT site's requests, unchanged (compatibility: the old site must keep working with the new service):
//  5. a plain MP4 conversion; 6. a compression.
// Every result is reopened with ffprobe: frame rate, frame count, durations. Uses 7 tickets (20 per hour per address).
// Usage: node scripts/browser-tests/media-service-p15-live.mjs <ffmpeg> [site] [service]
// --local: the same calls against the service started here (throwaway key, tickets signed by lib/media/ticket.js),
// to check this script itself before spending real tickets.
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const LOCAL = process.argv.includes('--local');
const pos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [FF, SITE = LOCAL ? 'http://localhost:3100' : 'https://www.onlineconvertools.com', SERVICE = LOCAL ? 'http://127.0.0.1:8622' : 'https://media-processing-production-d2f4.up.railway.app'] = pos;
let localTicket = null, localProc = null;
if (LOCAL) {
  const { mintTicket } = createRequire(import.meta.url)('../../lib/media/ticket.js');
  const secret = randomBytes(32).toString('base64url');
  const svcDir = resolve('services/media-processing');
  localProc = spawn(join(svcDir, '.venv/Scripts/python.exe'), ['-m', 'app.main'], { cwd: svcDir, stdio: 'ignore', env: { ...process.env, PORT: '8622', MEDIA_TICKET_SECRET: secret, ALLOWED_ORIGINS: SITE,
    MEDIA_MAX_CONCURRENT_JOBS: '2', MEDIA_MAX_QUEUED_JOBS: '10', MEDIA_MAX_FILE_BYTES: String(1024 ** 3), MEDIA_MAX_DURATION_SECONDS: '7200', MEDIA_JOB_TTL_SECONDS: '900',
    MEDIA_FFMPEG_TIMEOUT_SECONDS: '1500', MEDIA_WORK_DIR: mkdtempSync(join(tmpdir(), 'p15-svc-')), MEDIA_FFMPEG_PATH: FF, MEDIA_CHUNK_BYTES: String(8 * 1024 * 1024) } });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${SERVICE}/health`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }
  localTicket = (op) => mintTicket({ secret, op, maxBytes: 1024 ** 3 });
}
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const dir = mkdtempSync(join(tmpdir(), 'p15-live-'));
const ff = (...a) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...a]);
let fails = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`); if (!ok) fails++; };
const headers = (t, extra = {}) => ({ Authorization: 'Bearer ' + t, Origin: SITE, ...extra });

async function job(file, op, params) {
  const bytes = readFileSync(file);
  let jid, ticket;
  if (localTicket) ({ jid, ticket } = localTicket(op));
  else {
    const tr = await fetch(`${SITE}/api/media/ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: JSON.stringify({ op, size: bytes.length }) });
    const tj = await tr.json();
    if (!tr.ok) throw new Error(`ticket ${tr.status} ${tj.error}`);
    ({ jid, ticket } = tj);
  }
  const cr = await fetch(`${SERVICE}/v1/jobs`, { method: 'POST', headers: headers(ticket, { 'Content-Type': 'application/json' }), body: JSON.stringify({ op, size: bytes.length, params }) });
  const c = await cr.json();
  if (cr.status !== 201) return { status: 'error', error: `create ${cr.status} ${c.error || ''} ${c.message || ''}` };
  for (let n = 0; n < c.totalChunks; n++) {
    const chunk = bytes.subarray(n * c.chunkBytes, (n + 1) * c.chunkBytes);
    const pr = await fetch(`${SERVICE}/v1/jobs/${jid}/chunks/${n}`, { method: 'PUT', headers: headers(ticket, { 'X-Chunk-Sha256': createHash('sha256').update(chunk).digest('hex') }), body: chunk });
    if (pr.status !== 200) throw new Error(`chunk ${n}: ${pr.status}`);
  }
  const sr = await fetch(`${SERVICE}/v1/jobs/${jid}/start`, { method: 'POST', headers: headers(ticket) });
  let j = await sr.json();
  const t0 = Date.now();
  while (!['done', 'error'].includes(j.status) && Date.now() - t0 < 180000) {
    await new Promise((r) => setTimeout(r, 500));
    j = await (await fetch(`${SERVICE}/v1/jobs/${jid}`, { headers: headers(ticket) })).json();
  }
  if (j.status === 'done') {
    const rr = await fetch(`${SERVICE}/v1/jobs/${jid}/result`, { headers: headers(ticket) });
    j.file = join(dir, `${jid}.mp4`);
    writeFileSync(j.file, Buffer.from(await rr.arrayBuffer()));
  }
  await fetch(`${SERVICE}/v1/jobs/${jid}`, { method: 'DELETE', headers: headers(ticket) }).catch(() => {});
  return j;
}
const info = (p) => {
  const j = JSON.parse(execFileSync(FP, ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,duration,nb_read_frames,start_time:stream_side_data=rotation', '-of', 'json', p]).toString());
  const v = j.streams.find((s) => s.codec_type === 'video'), a = j.streams.find((s) => s.codec_type === 'audio');
  const rot = Math.abs(Number((v.side_data_list || [])[0]?.rotation || 0)) % 180;
  return { size: rot === 90 ? `${v.height}x${v.width}` : `${v.width}x${v.height}`, fps: v.r_frame_rate, frames: Number(v.nb_read_frames), vdur: Number(v.duration), adur: a ? Number(a.duration) : null, vstart: Number(v.start_time), codecs: `${v.codec_name}/${a ? a.codec_name : '-'}` };
};
const level = (p) => { const y = execFileSync(FF, ['-v', 'error', '-i', p, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], { maxBuffer: 1 << 26 }).subarray(0, 320 * 240); let s = 0; for (const b of y) s += b; return s / y.length; };

// fixtures
const plain = join(dir, 'plain.mp4'); ff('-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=3', '-f', 'lavfi', '-i', 'sine=d=3:r=48000', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', plain);
const tall = join(dir, 'tall.mp4'); ff('-f', 'lavfi', '-i', 'testsrc2=s=540x960:r=30:d=3', '-f', 'lavfi', '-i', 'sine=d=3:r=48000', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', tall);
const other = join(dir, 'other.webm'); ff('-f', 'lavfi', '-i', 'testsrc=s=480x270:r=25:d=2', '-f', 'lavfi', '-i', 'sine=f=660:d=2', '-c:v', 'libvpx-vp9', '-b:v', '300k', '-c:a', 'libopus', '-shortest', other);
const numbered = join(dir, 'numbered.mp4'); ff('-f', 'lavfi', '-i', 'color=c=black:s=320x240:r=30:d=10', '-f', 'lavfi', '-i', 'sine=d=10:r=48000', '-vf', "geq=lum='mod(N,256)':cb=128:cr=128", '-c:v', 'libx264', '-g', '60', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', numbered);
const piece = join(dir, 'piece.mkv'); ff('-ss', '0', '-i', numbered, '-t', '6', '-map', '0:v:0', '-map', '0:a:0', '-c', 'copy', '-avoid_negative_ts', 'make_zero', piece);
const p0 = Number(execFileSync(FP, ['-v', 'error', '-select_streams', 'v:0', '-read_intervals', '%+#1', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', piece]).toString().trim().split(',')[0]);

const health = await fetch(`${SERVICE}/health`); check(`/health ${health.status}`, health.ok);

let j = await job(plain, 'convert', { target: 'mp4', quality: 'high', rotate: 90 });
if (j.status !== 'done') check('1. rotate 90', false, j.error); else { const i = info(j.file); check(`1. rotate 90: ${i.size}, ${i.fps}, ${i.frames} frames, ${i.vdur} s, sound ${i.adur} s`, i.size === '360x640' && i.fps === '30/1' && i.frames === 90 && Math.abs(i.vdur - 3) < 0.001 && Math.abs(i.adur - 3) < 0.05); }

j = await job(tall, 'convert', { target: 'mp4', quality: 'high', fit: { w: 480, h: 854, mode: 'fit' } });
if (j.status !== 'done') check('2. fit 480x854', false, j.error); else { const i = info(j.file); check(`2. resize vertical 480p: ${i.size}, ${i.fps}, ${i.frames} frames, ${i.vdur} s`, i.size === '480x854' && i.fps === '30/1' && i.frames === 90 && Math.abs(i.vdur - 3) < 0.001); }

const parts = [];
for (const [f, name] of [[plain, 'plain'], [other, 'webm 25 fps']]) {
  j = await job(f, 'convert', { target: 'mp4', quality: 'high', fit: { w: 640, h: 360, mode: 'fit' }, fps: 30, forConcat: true });
  if (j.status !== 'done') { check(`3. forConcat ${name}`, false, j.error); continue; }
  const i = info(j.file);
  check(`3. forConcat ${name}: picture ${i.vdur} s = sound ${i.adur} s, ${i.fps}, ${i.size}`, Math.abs(i.vdur - i.adur) < 0.0015 && i.fps === '30/1' && i.size === '640x360');
  parts.push(j.file);
}
if (parts.length === 2) {
  const list = join(dir, 'list.txt'); writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n') + '\n');
  const joined = join(dir, 'joined.mp4'); ff('-f', 'concat', '-safe', '0', '-i', list, '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy', '-movflags', '+faststart', joined);
  const i = info(joined);
  check(`3. joined by copy: ${i.frames} frames, ${i.fps}, video ${i.vdur} s (5 s), no gap`, i.frames === 150 && i.fps === '30/1' && Math.abs(i.vdur - 5) < 0.001);
}

j = await job(piece, 'convert', { target: 'mp4', quality: 'high', clipStart: Math.round((p0 + 1) * 1000) / 1000, clipDuration: 4 });
if (j.status !== 'done') check('4. precise cut', false, j.error); else { const i = info(j.file); const l = level(j.file); check(`4. precise cut 1 s -> 5 s: ${i.frames} frames, video ${i.vdur} s, sound ${i.adur} s, first frame n° ${l.toFixed(1)}`, i.frames === 120 && Math.abs(i.vdur - 4) < 0.001 && Math.abs(i.adur - 4) < 0.022 && Math.abs(l - 30) < 1.5); }

j = await job(plain, 'convert', { target: 'mp4', quality: 'medium' });
if (j.status !== 'done') check('5. plain conversion (current site)', false, j.error); else { const i = info(j.file); check(`5. plain conversion as the current site sends it: ${i.codecs} ${i.size} ${i.frames} frames`, i.codecs === 'h264/aac' && i.size === '640x360' && i.frames === 90); }

j = await job(plain, 'compress', { level: 'balanced' });
check(`6. compression as the current site sends it: ${j.status}${j.error ? ' ' + j.error : ''}`, j.status === 'done' || /notSmaller|not smaller|already/i.test(j.error || ''));

if (localProc) localProc.kill();
console.log(fails ? `${fails} FAILED` : 'all passed', LOCAL ? '(local service)' : `(${SERVICE})`);
process.exit(fails ? 1 : 0);
