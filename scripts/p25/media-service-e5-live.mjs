// P25 (03/10, E5): the media service ONLINE, reached as a visitor's browser does (ticket from the site, chunked upload,
// start, poll, download) — after its deployment on Railway and BEFORE any page uses the new options:
//   1. /health says `edits: 2` (only the new code does);
//   2. the old requests behave as before (a default MP4 conversion, a default compression: H.264, same duration);
//   3. the new options work (mirror: pixels; speed 2x: duration; H.265: codec), and an unknown mirror value is refused
//      ("Unsupported mirror.") — the old service ignored unknown keys and succeeded: the proof the new code runs.
// Uses 6 tickets (the site allows 20 per hour per connection).
// Usage: node scripts/p25/media-service-e5-live.mjs <ffmpeg> [site] [service] [--before]
//   --before: run 1-2 only and expect NO `edits` (the state before the deployment, noted as the rollback reference).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const before = process.argv.includes('--before');
const [FF, SITE = 'https://www.onlineconvertools.com', SERVICE = 'https://media-processing-production-d2f4.up.railway.app'] = args;
const FP = join(dirname(FF), 'ffprobe' + (FF.endsWith('.exe') ? '.exe' : ''));
const dir = mkdtempSync(join(tmpdir(), 'e5-live-'));
const src = join(dir, 'clip.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x0000FF:s=320x240:r=30:d=4', '-f', 'lavfi', '-i', 'sine=f=440:d=4:sample_rate=48000',
  '-vf', 'drawbox=x=0:y=0:w=160:h=120:color=red:t=fill', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', src]);
const bytes = readFileSync(src);
let fails = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`); if (!ok) fails++; };
const headers = (t, extra = {}) => ({ Authorization: 'Bearer ' + t, Origin: SITE, ...extra });
const probe = (f) => JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], { encoding: 'utf8' }));
const v = (f) => probe(f).streams.find((s) => s.codec_type === 'video');
const pixel = (f, x, y) => { const s = v(f); const raw = execFileSync(FF, ['-v', 'error', '-i', f, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']); const i = (y * s.width + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]]; };

async function job(op, params) {
  const tr = await fetch(`${SITE}/api/media/ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: JSON.stringify({ op, size: bytes.length }) });
  const tj = await tr.json();
  if (!tr.ok) throw new Error(`ticket ${tr.status} ${tj.error}`);
  const { jid, ticket } = tj;
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
    await new Promise((r) => setTimeout(r, 700));
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

const health = await (await fetch(`${SERVICE}/health`)).json();
check(`/health: ${JSON.stringify(health)} — ${before ? 'no "edits" yet (previous version)' : '"edits": 2 (this code runs)'}`, before ? health.edits === undefined : health.edits === 2);
const conv = await job('convert', { target: 'mp4', quality: 'medium' });
check('default MP4 conversion (as Video Converter sends it): H.264, 4 s, red top-left kept', conv.status === 'done' && v(conv.file).codec_name === 'h264' && Math.abs(Number(probe(conv.file).format.duration) - 4) < 0.15 && pixel(conv.file, 20, 20)[0] > 180, conv.error || '');
const comp = await job('compress', { level: 'balanced' });
check('default compression (as Video Compressor sends it): H.264 MP4 or "not smaller" said', (comp.status === 'done' && (comp.notSmaller || v(comp.file).codec_name === 'h264')), comp.error || (comp.notSmaller ? 'not smaller (honest answer, as before)' : ''));
if (!before) {
  const m = await job('convert', { target: 'mp4', quality: 'high', flip: 'h' });
  check('mirror: the red quarter is now top right', m.status === 'done' && pixel(m.file, 300, 20)[0] > 180 && pixel(m.file, 20, 20)[0] < 80, m.error || '');
  const s = await job('convert', { target: 'mp4', quality: 'medium', speed: 2 });
  check('speed 2x: 2 s long', s.status === 'done' && Math.abs(Number(probe(s.file).format.duration) - 2) < 0.15, s.error || '');
  const h = await job('convert', { target: 'mp4', quality: 'medium', codec: 'h265' });
  check('codec H.265: hevc', h.status === 'done' && v(h.file).codec_name === 'hevc', h.error || '');
  const bad = await job('convert', { target: 'mp4', quality: 'medium', flip: 'x' });
  check('an unknown mirror is refused (only the new code does this)', bad.status === 'error' && /mirror/i.test(bad.error || ''), bad.error || bad.status);
}
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
