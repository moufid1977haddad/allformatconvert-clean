// Audio Merger: file order and transitions, real page, real files, results decoded here by a native ffmpeg.
// Sources are pure tones (A = 440 Hz 5 s, B = 1000 Hz 3 s, C = 2500 Hz 4 s) so the order and each fade can be read off
// the result (audio-merger-references/fade-analyse.mjs), plus sample-exact checks of everything outside the fades.
// - transitions all off by default, and then the join is exact (every sample, in the list's order);
// - order changed with the arrows, by dragging, by removing a file and adding it back;
// - crossfade: the length the page announces is the length of the file, to the sample; equal-power and linear curves
//   measured; a join left unticked stays a plain join; "fade out, then in" keeps the length; a crossfade longer than
//   the files allow is shortened and said; fade-in / fade-out on MP3 inputs start and end on silence;
// - into MP3, and (--opus, real media service) into Opus.
// Usage: node scripts/browser-tests/audio-merger-order-fade.mjs <origin> <ffmpeg> [--browser=firefox] [--opus] [--cors-shim] [--only=c1,c5]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1];
const engine = { firefox, webkit }[arg('browser')] || chromium;
const only = arg('only') ? arg('only').split(',') : null;
const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merger-order-fade-'));
const ff = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: tmp, maxBuffer: 1 << 29, stdio: ['ignore', 'pipe', 'pipe'] });
const tone = (name, hz, secs, extra = ['-sample_fmt', 's16']) => { ff(['-f', 'lavfi', '-i', `sine=frequency=${hz}:sample_rate=44100:duration=${secs}`, '-af', 'volume=4', '-ac', '2', ...extra, name]); return path.join(tmp, name); };
const A = tone('A440.flac', 440, 5), B = tone('B1000.flac', 1000, 3), C = tone('C2500.flac', 2500, 4);
const Am = tone('A440.mp3', 440, 5, ['-b:a', '192k']), Bm = tone('B1000.mp3', 1000, 3, ['-b:a', '192k']);
const RATE = 44100;
// Stereo 16-bit samples at 44.1 kHz, each file decoded on its own (what a listener hears playing them in turn).
const s16 = (f) => { const b = ff(['-i', f, '-map', '0:a', '-ac', '2', '-ar', String(RATE), '-f', 's16le', '-']); return new Int16Array(b.buffer, b.byteOffset, b.length / 2); };
const hash = (arrays) => { const h = crypto.createHash('sha256'); for (const a of arrays) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); return h.digest('hex'); };
const firstDiff = (x, xFrom, y, yFrom, len) => { for (let i = 0; i < len; i++) if (x[xFrom + i] !== y[yFrom + i]) return i; return -1; };
const analyse = (f) => JSON.parse(execFileSync('node', [path.join(here, 'audio-merger-references', 'fade-analyse.mjs'), FF, f, '--json']).toString());
const rms = (a, from, to) => { let s = 0; for (let i = from; i < to; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, to - from)); };
const names = (p) => p.locator('[data-testid=merge-name]').allInnerTexts().then((t) => t.map((x) => x.replace(/^\d+\.\s*/, '').replace(/\..*$/, '')));

const b = await engine.launch(engine === firefox ? { firefoxUserPrefs: { 'media.autoplay.default': 0 } } : {});
const ctx = await b.newContext({ acceptDownloads: true });
const { authorize } = await import('./vercel-preview-auth.mjs'); await authorize(ctx, origin);
// Opus goes to the real media service (see audio-merger-join.mjs for --cors-shim).
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

async function open(files) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/audio-tools/audio-merger`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(files);
  await p.locator('#merge-format').waitFor({ timeout: 120000 });
  return p;
}
async function mergeAndSave(p, tag) {
  await p.getByRole('button', { name: /^Merge/ }).click();
  await Promise.race([p.locator('a[download]').first().waitFor({ timeout: 240000 }),
    p.locator('text=/Merge failed/').waitFor({ timeout: 240000 }).then(async () => { throw new Error(await p.locator('text=/Merge failed/').innerText()); })]);
  // The browser that made it plays it to the end (not for formats it cannot play).
  const play = await p.evaluate(async () => {
    const a = document.querySelector('audio'); if (!a) return null;
    a.muted = true; a.playbackRate = 8;
    await new Promise((r) => { if (a.readyState >= 1) r(); else { a.onloadedmetadata = r; setTimeout(r, 10000); } });
    const dur = a.duration;
    const ended = await new Promise((r) => { a.onended = () => r(true); setTimeout(() => r(false), 30000); a.play().catch(() => r(false)); });
    return { dur: +dur.toFixed(3), ended, t: +a.currentTime.toFixed(3) };
  });
  const shown = await p.locator('a[download]').first().evaluate((a) => a.previousElementSibling?.innerText || '');
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').first().click()]);
  const out = path.join(tmp, `${tag}-${d.suggestedFilename()}`); await d.saveAs(out);
  return { out, play, shown };
}
const notes = (p) => p.locator('[data-testid=merge-notes]').innerText().catch(() => '');

let fails = 0;
const cases = {
  async c1() { // transitions off by default -> exact join in list order
    const p = await open([A, B, C]);
    const off = await p.evaluate(() => ['crossfade', 'fade-in', 'fade-out'].map((id) => document.getElementById(id)?.checked));
    const { out, play } = await mergeAndSave(p, 'c1');
    const exact = hash([s16(out)]) === hash([s16(A), s16(B), s16(C)]);
    return { ok: off.every((x) => x === false) && exact && play?.ended, info: { defaultsOff: off, exact, play } };
  },
  async c2() { // arrows
    const p = await open([A, B, C]);
    await p.getByRole('button', { name: 'Move A440.flac down' }).click();
    const order = await names(p);
    const { out } = await mergeAndSave(p, 'c2');
    const exact = hash([s16(out)]) === hash([s16(B), s16(A), s16(C)]);
    return { ok: order.join() === 'B1000,A440,C2500' && exact, info: { order, exact, analysed: analyse(out).order } };
  },
  async c3() { // drag C to the top
    const p = await open([A, B, C]);
    const rows = p.locator('[data-testid=merge-item]');
    await rows.nth(2).dragTo(rows.nth(0));
    const order = await names(p);
    const { out } = await mergeAndSave(p, 'c3');
    const exact = hash([s16(out)]) === hash([s16(C), s16(A), s16(B)]);
    return { ok: order.join() === 'C2500,A440,B1000' && exact, info: { order, exact } };
  },
  async c4() { // remove B, add it back at the end
    const p = await open([A, B, C]);
    await p.getByRole('button', { name: 'Remove B1000.flac' }).click();
    await p.locator('input[type=file]').setInputFiles([B]);
    await p.waitForFunction(() => document.querySelectorAll('[data-testid=merge-item]').length === 3 && !document.body.innerText.includes('reading…'), null, { timeout: 60000 });
    const order = await names(p);
    const { out } = await mergeAndSave(p, 'c4');
    const exact = hash([s16(out)]) === hash([s16(A), s16(C), s16(B)]);
    return { ok: order.join() === 'A440,C2500,B1000' && exact, info: { order, exact } };
  },
  async c5() { // equal-power crossfade 1.2 s at both joins (the 3 s file allows 1.5 s at most)
    const p = await open([A, B, C]);
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('1.2');
    const n = await notes(p);
    const { out, play, shown } = await mergeAndSave(p, 'c5');
    const o = s16(out), a = s16(A), c = s16(C), fs2 = Math.round(1.2 * RATE) * 2;
    const len = o.length / 2 / RATE;
    const head = firstDiff(o, 0, a, 0, a.length - fs2), tail = firstDiff(o, o.length - (c.length - fs2), c, fs2, c.length - fs2);
    const an = analyse(out);
    const mid = an.tones.A.fadeOutCurve[1];
    const ok = /lasts 0:09\.6 instead of 0:12\.0/.test(n) && Math.abs(len - 9.6) < 1e-9 && head === -1 && tail === -1 && mid > 0.6 && mid < 0.75 && an.order === 'ABC' && play?.ended && /0:09\.6/.test(shown);
    return { ok, info: { note: n.split('\n')[0], len, head, tail, curve: an.tones.A.fadeOutCurve, fadeLen: an.tones.A.fadeOut, play, shown } };
  },
  async c6() { // linear 1.5 s, second join unticked
    const p = await open([A, B, C]);
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('1.5'); await p.locator('#fade-curve').selectOption('tri');
    await p.locator('[data-testid=join-fade-1]').uncheck();
    const n = await notes(p);
    const { out } = await mergeAndSave(p, 'c6');
    const o = s16(out), len = o.length / 2 / RATE, an = analyse(out);
    // B -> C is the plain join: B's last 1.5 s .. C all unchanged.
    const bc = s16(B), cc = s16(C), f15 = Math.round(1.5 * RATE) * 2;
    const plain = firstDiff(o, o.length - cc.length - (bc.length - f15), new Int16Array([...bc.subarray(f15), ...cc]), 0, bc.length - f15 + cc.length);
    const ok = /1 of 2 joins/.test(n) && /lasts 0:10\.5/.test(n) && len === 10.5 && Math.abs(an.tones.A.fadeOutCurve[1] - 0.5) < 0.04 && plain === -1;
    return { ok, info: { note: n.split('\n')[0], len, curve: an.tones.A.fadeOutCurve, plainJoinExact: plain === -1 } };
  },
  async c7() { // fade out then in, 1 s: same length
    const p = await open([A, B, C]);
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('1'); await p.locator('#fade-mode').selectOption('gap');
    const n = await notes(p);
    const { out } = await mergeAndSave(p, 'c7');
    const o = s16(out), len = o.length / 2 / RATE, j = 5 * RATE * 2, w = 441 * 2;
    const quiet = rms(o, j - w, j + w) / rms(o, 0, 3 * RATE * 2);
    return { ok: /length is kept \(0:12\.0\)/.test(n) && len === 12 && quiet < 0.05, info: { note: n.split('\n')[0], len, levelAtJoin: +quiet.toFixed(4) } };
  },
  async c8() { // fade-in and fade-out on MP3 inputs, WAV out: exact length, silence at both ends
    const p = await open([Am, Bm]);
    await p.locator('#merge-format').selectOption('wav');
    await p.locator('#fade-in').check(); await p.locator('#fade-out').check(); await p.locator('#fade-secs').fill('1');
    const { out } = await mergeAndSave(p, 'c8');
    const o = s16(out), want = s16(Am).length + s16(Bm).length, w = 441 * 2;
    const full = rms(o, 2 * RATE * 2, 3 * RATE * 2);
    const startLvl = rms(o, 0, w) / full, endLvl = rms(o, o.length - w, o.length) / full, before = rms(o, o.length - Math.round(1.2 * RATE) * 2, o.length - Math.round(1.1 * RATE) * 2) / full;
    return { ok: o.length === want && startLvl < 0.02 && endLvl < 0.02 && before > 0.9, info: { lenSamples: o.length / 2, want: want / 2, startLvl: +startLvl.toFixed(4), endLvl: +endLvl.toFixed(4), before: +before.toFixed(3) } };
  },
  async c9() { // 10 s asked, the 3 s file allows 1.5 s
    const p = await open([A, B, C]);
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('10');
    const n = await notes(p);
    const { out } = await mergeAndSave(p, 'c9');
    const len = s16(out).length / 2 / RATE;
    return { ok: /shortened to 1\.5 s/.test(n) && /lasts 0:09\.0/.test(n) && len === 9, info: { note: n.replace(/\n/g, ' | ').slice(0, 300), len } };
  },
  async c10() { // crossfade into MP3 320
    const p = await open([A, B, C]);
    await p.locator('#merge-format').selectOption('mp3');
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('1.2');
    const { out, play } = await mergeAndSave(p, 'c10');
    const len = s16(out).length / 2 / RATE, an = analyse(out);
    return { ok: Math.abs(len - 9.6) < 0.05 && an.order === 'ABC' && play?.ended, info: { len, order: an.order, play } };
  },
  async c11() { // crossfade into Opus, encoded by the real media service
    if (!process.argv.includes('--opus')) return { ok: true, info: 'skipped (no --opus)' };
    const before = serviceCalls.filter((c) => c === 'POST /v1/jobs').length;
    const p = await open([A, B, C]);
    await p.locator('#merge-format').selectOption('opus');
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('1.2');
    const { out, play } = await mergeAndSave(p, 'c11');
    const len = s16(out).length / 2 / RATE, an = analyse(out);
    const enc = execFileSync(FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'stream_tags=encoder:format_tags=encoder', '-of', 'default=nw=1', out]).toString().trim();
    const jobs = serviceCalls.filter((c) => c === 'POST /v1/jobs').length - before;
    return { ok: Math.abs(len - 9.6) < 0.03 && an.order === 'ABC' && jobs === 1 && /libopus/i.test(enc) && play?.ended, info: { len, order: an.order, jobs, enc, play } };
  },
  async c12() { // real progress during a long merge with a crossfade (it stood still: ffmpeg.wasm kept ffprobe's "-v error")
    const L1 = tone('L1.flac', 440, 600), L2 = tone('L2.flac', 1000, 600);
    const p = await open([L1, L2]);
    await p.locator('#merge-format').selectOption('mp3');
    await p.locator('#crossfade').check(); await p.locator('#fade-secs').fill('5');
    const seen = new Set();
    await p.getByRole('button', { name: /^Merge/ }).click();
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) {
      const v = await p.locator('[role=progressbar]').getAttribute('aria-valuenow', { timeout: 1000 }).catch(() => null);
      if (v !== null) seen.add(Number(v));
      if (await p.locator('a[download]').count()) break;
      await p.waitForTimeout(250);
    }
    const mid = [...seen].filter((v) => v > 0 && v < 100);
    const shown = await p.locator('a[download]').first().evaluate((a) => a.previousElementSibling?.innerText || '');
    return { ok: mid.length >= 3 && /19:55/.test(shown), info: { progressValues: [...seen].sort((a, b) => a - b), shown } };
  },
};
for (const [name, fn] of Object.entries(cases)) {
  if (only && !only.includes(name)) continue;
  try {
    const r = await fn();
    if (!r.ok) fails++;
    console.log(r.ok ? 'PASS' : 'FAIL', name, JSON.stringify(r.info));
  } catch (e) { fails++; console.log('FAIL', name, String(e.message || e).split('\n')[0].slice(0, 300)); }
  for (const pg of ctx.pages()) await pg.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);
