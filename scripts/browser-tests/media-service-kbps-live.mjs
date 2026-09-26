// The media service ONLINE, reached the way a visitor's browser reaches it: a one-job ticket from the site
// (/api/media/ticket), then the file sent in chunks to the service, started, polled, downloaded. Checks the optional
// "kbps" parameter (Audio Compressor's Opus) on the deployed service, and that "no kbps" still gives 128 kbit/s.
// The only proof the NEW code runs: "kbps" on an MP3 is refused (the old service would ignore it and succeed).
// Uses 4 tickets (the site allows 20 per hour per connection).
// Usage: node scripts/browser-tests/media-service-kbps-live.mjs <ffmpeg> [site] [service]
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [FF, SITE = 'https://www.onlineconvertools.com', SERVICE = 'https://media-processing-production-d2f4.up.railway.app'] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'kbps-live-'));
const src = join(dir, 'src.flac');
// 20 s of pink noise over a tone: dense enough that VBR Opus lands near its target (a pure tone lands far below).
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.25:sample_rate=48000',
  '-f', 'lavfi', '-i', 'sine=frequency=330:sample_rate=48000', '-filter_complex', '[0:a][1:a]amix=inputs=2,aformat=channel_layouts=stereo[a]',
  '-map', '[a]', '-t', '20', '-c:a', 'flac', src]);
const bytes = readFileSync(src);

let fails = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`); if (!ok) fails++; };
const headers = (t, extra = {}) => ({ Authorization: 'Bearer ' + t, Origin: SITE, ...extra });

async function job(params) {
  const tr = await fetch(`${SITE}/api/media/ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: JSON.stringify({ op: 'convert', size: bytes.length }) });
  const tj = await tr.json();
  if (!tr.ok) throw new Error(`ticket ${tr.status} ${tj.error}`);
  const { jid, ticket } = tj;
  const cr = await fetch(`${SERVICE}/v1/jobs`, { method: 'POST', headers: headers(ticket, { 'Content-Type': 'application/json' }), body: JSON.stringify({ op: 'convert', size: bytes.length, params }) });
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
  while (!['done', 'error'].includes(j.status) && Date.now() - t0 < 120000) {
    await new Promise((r) => setTimeout(r, 500));
    j = await (await fetch(`${SERVICE}/v1/jobs/${jid}`, { headers: headers(ticket) })).json();
  }
  if (j.status === 'done') {
    const rr = await fetch(`${SERVICE}/v1/jobs/${jid}/result`, { headers: headers(ticket) });
    j.contentType = rr.headers.get('content-type');
    j.file = join(dir, `${jid}.out`);
    writeFileSync(j.file, Buffer.from(await rr.arrayBuffer()));
  }
  await fetch(`${SERVICE}/v1/jobs/${jid}`, { method: 'DELETE', headers: headers(ticket) }).catch(() => {});
  return j;
}

function decoded(file) {
  // ffmpeg writes its report on stderr.
  const p = spawnSync(FF, ['-hide_banner', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const e = p.stderr;
  const t = [...e.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
  return { secs: t ? +t[1] * 3600 + +t[2] * 60 + +t[3] : 0, codec: (e.match(/Audio: (\w+)/) || [])[1], errors: /error/i.test(e.split('Output #0')[1] || '') };
}

for (const [label, params, want] of [['no kbps (as Audio Converter)', { target: 'opus', quality: 'medium' }, 128], ['kbps 64', { target: 'opus', quality: 'medium', kbps: 64 }, 64], ['kbps 256', { target: 'opus', quality: 'medium', kbps: 256 }, 256]]) {
  const j = await job(params);
  if (j.status !== 'done') { check(`${label}: done`, false, j.error); continue; }
  const d = decoded(j.file);
  const kbps = statSync(j.file).size * 8 / 1000 / d.secs;
  check(`${label}: Opus (${d.codec}, ${j.contentType}), ${d.secs.toFixed(2)} s, ~${want} kbit/s`, d.codec === 'opus' && Math.abs(d.secs - 20) < 0.1 && kbps > 0.7 * want && kbps < 1.3 * want, `${kbps.toFixed(1)} kbit/s measured`);
}
const bad = await job({ target: 'mp3', quality: 'medium', kbps: 64 });
check('kbps on MP3 refused (only the new service does this)', bad.status === 'error' && /bitrate/i.test(bad.error || ''), bad.error || bad.status);
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
