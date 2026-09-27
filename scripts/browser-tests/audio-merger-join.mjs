// Audio Merger: is a join exact? Real page, real files; the merged file is checked two ways.
// 1. Here, by ffmpeg: each input is decoded ON ITS OWN (encoder delay / pre-skip / padding removed by its own headers,
//    the reference a listener hears when playing the files one after the other), then each input is located in the
//    decoded result by correlation. Per junction: where the next file really starts (drift, ms), the longest near-silence
//    around it beyond the quiet the two sources already have there (gap, ms), and how faithful the first 50 ms after it are (SNR, dB). Plus total length against the sum.
// 2. In the browser that made it: decodeAudioData duration, <audio> duration, and a full play to 'ended'.
// Sources are pink noise + a tone (never silent), so any silence at a junction is the join's.
// Usage: node scripts/browser-tests/audio-merger-join.mjs <origin> <ffmpeg> [--browser=firefox] [--only=opus,mp3]
//        [--format=<value of the output select>] (the output-format choice, once it exists)
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1];
const engine = arg('browser') === 'firefox' ? firefox : chromium;
const only = arg('only') ? arg('only').split(',') : null;
const FORMAT = arg('format');
const ff = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merger-join-'));

// Three sources: 5 s, 3 s, 4 s, 44.1 kHz stereo.
const LENS = [5, 3, 4];
const wavs = LENS.map((secs, i) => {
  const f = path.join(tmp, `src${i}.wav`);
  ff(['-y', '-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.1:sample_rate=44100:seed=${i + 1}`, '-f', 'lavfi', '-i', `sine=frequency=${440 + 220 * i}:sample_rate=44100`,
    '-filter_complex', '[1:a]volume=0.2[s];[0:a][s]amix=inputs=2,aformat=channel_layouts=stereo:sample_fmts=s16[a]', '-map', '[a]', '-t', String(secs), f]);
  return f;
});
const SETS = {
  opus: { ext: 'opus', args: ['-c:a', 'libopus', '-b:a', '128k'] },
  vorbis: { ext: 'ogg', args: ['-c:a', 'libvorbis', '-q:a', '5'] },
  'aac-m4a': { ext: 'm4a', args: ['-c:a', 'aac', '-b:a', '192k'] },
  'aac-adts': { ext: 'aac', args: ['-c:a', 'aac', '-b:a', '192k'] },
  flac: { ext: 'flac', args: ['-c:a', 'flac'] },
  mp3: { ext: 'mp3', args: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  wav: { ext: 'wav', args: ['-c:a', 'pcm_s16le'] },
  'mixed-flac-wav': { mixed: ['flac', 'wav', 'flac'] },
  'mixed-flac-mp3': { mixed: ['flac', 'mp3', 'flac'] },
};
function inputsFor(name) {
  const s = SETS[name];
  return wavs.map((w, i) => {
    const set = s.mixed ? SETS[s.mixed[i]] : s;
    const f = path.join(tmp, `${name}-${i}.${set.ext}`);
    ff(['-y', '-i', w, ...set.args, f]);
    return f;
  });
}
// Mono float PCM at a fixed rate (the output's own rate, so lossy decoders are compared on their native grid).
function pcm(file, rate) {
  const buf = ff(['-i', file, '-map', '0:a:0', '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-']);
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
}
function probe(file) {
  const out = execFileSync(FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'format=format_name,duration:stream=codec_name,sample_rate', '-of', 'json', file]).toString();
  const j = JSON.parse(out); const a = (j.streams || []).find((s) => s.sample_rate) || {};
  return { container: j.format?.format_name, duration: Number(j.format?.duration), codec: a.codec_name, rate: Number(a.sample_rate) };
}
// Quiet already inside a source (an encoder's trailing padding, measured on ffmpeg's AAC): a player plays it too, so it
// is not the join's. Leading / trailing run under 1e-3, in samples.
const quiet = (x) => { let a = 0; while (a < x.length && Math.abs(x[a]) < 1e-3) a++; let z = 0; while (z < x.length && Math.abs(x[x.length - 1 - z]) < 1e-3) z++; return [a, z]; };
const snrDb = (ref, out) => { let s = 0, n = 0; for (let i = 0; i < ref.length; i++) { s += ref[i] ** 2; n += (ref[i] - out[i]) ** 2; } return n === 0 ? 'identical' : 10 * Math.log10(s / n); };
function locate(ref, out, expected, rate) {
  // Match 1 s taken from the middle of the input; search ±150 ms around where it should be.
  const w0 = Math.floor(ref.length / 2 - rate / 2), W = rate, R = Math.floor(0.15 * rate);
  let best = -Infinity, bestD = 0;
  for (let d = -R; d <= R; d++) {
    const o = expected + w0 + d; if (o < 0 || o + W > out.length) continue;
    let c = 0; for (let i = 0; i < W; i += 4) c += ref[w0 + i] * out[o + i];
    if (c > best) { best = c; bestD = d; }
  }
  return bestD;
}
function analyse(outFile, inputs) {
  const p = probe(outFile); const rate = p.rate || 44100;
  const out = pcm(outFile, rate); const refs = inputs.map((f) => pcm(f, rate));
  const sum = refs.reduce((a, r) => a + r.length, 0);
  const junctions = []; let start = 0;
  refs.forEach((ref, i) => {
    const d = locate(ref, out, start, rate); const at = start + d;
    if (i > 0) {
      const H = Math.floor(0.05 * rate); // first 50 ms after the junction
      const snr = snrDb(ref.subarray(0, H), out.subarray(at, at + H));
      let run = 0, gap = 0; const lo = Math.max(0, start - Math.floor(0.2 * rate)), hi = Math.min(out.length, start + Math.floor(0.2 * rate));
      for (let k = lo; k < hi; k++) { if (Math.abs(out[k]) < 1e-3) { run++; gap = Math.max(gap, run); } else run = 0; }
      const own = quiet(refs[i - 1])[1] + quiet(ref)[0];
      junctions.push({ driftMs: +((d / rate) * 1000).toFixed(2), gapMs: +((Math.max(0, gap - own) / rate) * 1000).toFixed(2), sourceQuietMs: +((own / rate) * 1000).toFixed(2), snr50: typeof snr === 'number' ? +snr.toFixed(1) : snr });
    }
    start = at + ref.length;
  });
  return { ...p, sumSecs: +(sum / rate).toFixed(4), outSecs: +(out.length / rate).toFixed(4), diffMs: +(((out.length - sum) / rate) * 1000).toFixed(2), junctions };
}

const b = await engine.launch(engine === firefox ? { firefoxUserPrefs: { 'media.autoplay.default': 0 } } : {});
const ctx = await b.newContext({ acceptDownloads: true });
const { authorize } = await import('./vercel-preview-auth.mjs'); await authorize(ctx, origin);
// Opus goes to the real media service. On an origin it does not list (a preview, or the localhost proxy of one) it
// answers without CORS headers: --cors-shim relays its calls through Playwright and adds that header, nothing else
// (same as audio-opus-real.mjs). On www, run without it.
const SERVICE = 'https://media-processing-production-d2f4.up.railway.app';
const serviceCalls = [];
await ctx.route(SERVICE + '/**', async (r) => {
  const req = r.request(); serviceCalls.push(`${req.method()} ${new URL(req.url()).pathname}`);
  if (!process.argv.includes('--cors-shim')) return r.continue();
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS' };
  if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const resp = await r.fetch();
  return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
});
let fails = 0;
for (const name of Object.keys(SETS).filter((n) => !only || only.includes(n))) {
  const inputs = inputsFor(name);
  const p = await ctx.newPage();
  try {
    await p.goto(`${origin}/tools/audio-tools/audio-merger`, { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').setInputFiles(inputs);
    if (FORMAT) await p.locator('#merge-format').selectOption(FORMAT, { timeout: 120000 });
    await p.getByRole('button', { name: /^Merge/ }).click();
    await Promise.race([p.locator('a[download]').first().waitFor({ timeout: 180000 }),
      p.locator('text=/Merge failed/').waitFor({ timeout: 180000 }).then(async () => { throw new Error(await p.locator('text=/Merge failed/').innerText()); })]);
    const browser = await p.evaluate(async () => {
      const url = document.querySelector('a[download]').href;
      const buf = await (await fetch(url)).arrayBuffer();
      let decoded; try { decoded = +(await new OfflineAudioContext(1, 1, 48000).decodeAudioData(buf.slice(0))).duration.toFixed(3); } catch (e) { decoded = 'ERR ' + e.message; }
      const a = new Audio(url); a.muted = true;
      await new Promise((r) => { a.onloadedmetadata = r; a.onerror = r; setTimeout(r, 10000); });
      const elDur = a.duration; const errCode = a.error?.code;
      a.playbackRate = 4;
      const played = await new Promise((r) => { a.onended = () => r({ ended: true, t: a.currentTime }); a.onerror = () => r({ ended: false, err: a.error?.code }); setTimeout(() => r({ ended: false, t: a.currentTime }), 20000); a.play().catch((e) => r({ ended: false, err: e.message })); });
      return { decoded, errCode, elDur: Number.isFinite(elDur) ? +elDur.toFixed(3) : String(elDur), ...played, t: played.t != null ? +played.t.toFixed(3) : undefined };
    });
    // A format this browser cannot play at all (Chromium: WMA, AC3, ALAC, AIFF) is not the merge's fault: the file is
    // still checked by ffmpeg below, and the page must say there is no preview instead of showing a broken player.
    const unplayable = typeof browser.decoded === 'string' && browser.errCode === 4; // MEDIA_ERR_SRC_NOT_SUPPORTED
    if (unplayable) browser.noPreviewShown = await p.locator('[data-testid=no-preview]').isVisible();
    const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').first().click()]);
    const outFile = path.join(tmp, `${name}-out-${d.suggestedFilename()}`); await d.saveAs(outFile);
    const r = analyse(outFile, inputs);
    // Lossy outputs may end with up to one codec frame of the encoder's padding (46 ms max, see audio-merger-formats.mjs);
    // nothing may be missing, and the joins must be exact either way.
    const lossy = !/^(flac|alac|pcm_)/.test(r.codec);
    const ok = (lossy ? r.diffMs >= -1 && r.diffMs <= 47 : Math.abs(r.diffMs) <= 1) && r.junctions.every((j) => Math.abs(j.driftMs) <= 1 && j.gapMs <= 1)
      && (unplayable ? browser.noPreviewShown === true
        : typeof browser.decoded === 'number' && Math.abs(browser.decoded - r.outSecs) <= 0.05 && browser.ended && Math.abs(browser.t - r.outSecs) <= 0.05);
    if (!ok) fails++;
    console.log(ok ? 'PASS' : 'FAIL', name, '->', d.suggestedFilename(), JSON.stringify({ serviceJobs: serviceCalls.filter((c) => c === 'POST /v1/jobs').length, codec: r.codec, container: r.container, probeSecs: r.duration, outSecs: r.outSecs, sumSecs: r.sumSecs, diffMs: r.diffMs, junctions: r.junctions, browser }));
  } catch (e) { fails++; console.log('FAIL', name, String(e.message || e).slice(0, 300)); }
  await p.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);
