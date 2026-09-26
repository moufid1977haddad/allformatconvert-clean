// Opus of Audio Booster, Audio Splitter, Audio Compressor (and Audio Converter) END TO END with the REAL media
// service: real pages, real ticket from the site, real upload, real libopus encode, real download. Every file is
// decoded here by ffmpeg (codec, duration, bitrate); the Compressor's must sit near the 64 kbit/s picked.
// On an origin the service does not list (a preview, or the localhost proxy of one), the service answers without CORS
// headers (it never refuses, cors.py only adds them for listed origins): --cors-shim then relays the service's calls
// through Playwright and adds that header, nothing else. On www, run without it: everything is the real path.
// Uses 5 tickets (the site allows 20 per hour per connection).
// Usage: node scripts/browser-tests/audio-opus-real.mjs <origin> <ffmpeg> [--browser=firefox] [--cors-shim]
import { chromium, firefox } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const SERVICE = 'https://media-processing-production-d2f4.up.railway.app';
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'opus-real-'));
const input = path.join(tmp, 'opus-real.wav'); // 4 s of pink noise over a tone, 1/8 of full scale (a 2x boost does not clip)
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.1:sample_rate=44100',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100', '-filter_complex', '[1:a]volume=0.1[s];[0:a][s]amix=inputs=2,aformat=channel_layouts=stereo:sample_fmts=s16[a]',
  '-map', '[a]', '-t', '4', input]);
function decode(file) {
  const e = spawnSync(FF, ['-hide_banner', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const t = [...e.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
  const secs = t ? +t[1] * 3600 + +t[2] * 60 + +t[3] : 0;
  return { codec: (e.match(/Audio: (\w+)/) || [])[1], secs, kbps: secs ? (fs.statSync(file).size * 8) / 1000 / secs : 0 };
}

const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
const serviceCalls = [];
await ctx.route(SERVICE + '/**', async (r) => {
  const req = r.request();
  serviceCalls.push(`${req.method()} ${new URL(req.url()).pathname}`);
  if (!process.argv.includes('--cors-shim')) return r.continue();
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS' };
  if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const resp = await r.fetch();
  return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
});
async function open(tool) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/audio-tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(input);
  return p;
}
async function downloads(p) {
  const out = [];
  for (const a of await p.locator('a[download]').all()) {
    const [d] = await Promise.all([p.waitForEvent('download'), a.click()]);
    const f = path.join(tmp, d.suggestedFilename()); await d.saveAs(f); out.push({ name: d.suggestedFilename(), ...decode(f) });
  }
  return out;
}
const done = (p, n = 0) => Promise.race([p.locator('a[download]').nth(n).waitFor({ timeout: 180000 }), p.locator('text=/failed|error|could not/i').first().waitFor({ timeout: 180000 }).then(async () => { throw new Error(await p.locator('text=/failed|error|could not/i').first().innerText()); })]);
const jobsPosted = () => serviceCalls.filter((c) => c === 'POST /v1/jobs').length;

for (const [tool, run] of [
  ['audio-booster', async (p) => { await p.locator('main select, select.w-full').first().selectOption('opus'); await p.getByRole('button', { name: 'Boost Audio' }).click(); await done(p); }],
  ['audio-splitter', async (p) => { await p.locator('main select, select.w-full').first().selectOption('opus'); await p.waitForFunction(() => document.querySelector('input[type=range]')?.max === '3'); await p.getByRole('button', { name: /Split/ }).click(); await done(p, 1); }],
  ['audio-compressor', async (p) => { await p.getByRole('button', { name: '64k', exact: true }).click(); await p.locator('main select, select.w-full').first().selectOption('opus'); await p.getByRole('button', { name: /Compress/ }).click(); await done(p); }],
  ['audio-converter', async (p) => { await p.locator('main select, select.w-full').first().selectOption('opus'); await p.getByRole('button', { name: /Convert/ }).first().click(); await done(p); }],
]) {
  const before = jobsPosted(); const t0 = Date.now();
  const p = await open(tool);
  try {
    await run(p);
    const ds = await downloads(p); const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const jobs = jobsPosted() - before;
    const info = ds.map((d) => `${d.name} ${d.codec} ${d.secs.toFixed(2)} s ${d.kbps.toFixed(0)} kbit/s`).join(' | ') + ` | ${jobs} job(s), ${secs} s`;
    const opus = ds.length && ds.every((d) => d.codec === 'opus' && d.name.endsWith('.opus'));
    if (tool === 'audio-splitter') check(`${tool}: 2 real libopus files, 3 s and 1 s`, opus && ds.length === 2 && jobs === 2 && Math.abs(ds[0].secs - 3) < 0.05 && Math.abs(ds[1].secs - 1) < 0.05, info);
    else if (tool === 'audio-compressor') check(`${tool}: real libopus, 4 s, near the 64 kbit/s picked`, opus && jobs === 1 && Math.abs(ds[0].secs - 4) < 0.05 && ds[0].kbps > 40 && ds[0].kbps < 90, info);
    else check(`${tool}: real libopus, 4 s`, opus && jobs === 1 && Math.abs(ds[0].secs - 4) < 0.05, info);
  } catch (e) { check(`${tool}: finished`, false, String(e.message || e).slice(0, 300)); }
  await p.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);
