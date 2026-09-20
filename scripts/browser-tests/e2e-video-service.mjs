// End-to-end: the REAL site pages (video-compressor, video-converter, built with
// NEXT_PUBLIC_MEDIA_SERVICE_URL) + the REAL media-processing service + a real
// ffmpeg, driven in Chromium, Firefox and WebKit. Only /api/media/ticket is
// answered locally: with a ticket minted by the site's own lib/media/ticket.js
// (its rate limit needs the production database, which agents may not touch).
//
// Usage: node scripts/browser-tests/e2e-video-service.mjs <siteUrl> <ffmpeg> <dir with s30.mp4 clip.mov surf.mp4>
import { chromium, firefox, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { mintTicket } = require('../../lib/media/ticket.js');
const [site, ffmpeg, dir] = process.argv.slice(2);
const secret = randomBytes(32).toString('base64url'); // throwaway, in memory only
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-media-'));
const svcDir = path.resolve('services/media-processing');
const py = path.join(svcDir, '.venv/Scripts/python.exe');
const PORT = 8621;

const svc = spawn(py, ['-m', 'app.main'], {
  cwd: svcDir,
  env: { ...process.env, PORT: String(PORT), MEDIA_TICKET_SECRET: secret, ALLOWED_ORIGINS: new URL(site).origin,
    MEDIA_MAX_CONCURRENT_JOBS: '2', MEDIA_MAX_QUEUED_JOBS: '10', MEDIA_MAX_FILE_BYTES: String(1024 ** 3), MEDIA_MAX_DURATION_SECONDS: '7200',
    MEDIA_JOB_TTL_SECONDS: '900', MEDIA_FFMPEG_TIMEOUT_SECONDS: '1500', MEDIA_WORK_DIR: work, MEDIA_FFMPEG_PATH: ffmpeg, MEDIA_CHUNK_BYTES: String(8 * 1024 * 1024) },
  stdio: 'ignore',
});
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/health`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const ok = [];
const bad = [];
const check = (name, cond, detail = '') => { (cond ? ok : bad).push(name); console.log(cond ? '  PASS' : '  FAIL', name, cond ? '' : detail); };

async function drive(engineName, engine) {
  console.log(`\n===== ${engineName} =====`);
  const browser = await engine.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const stages = new Set();
  const runOnce = async (label, url, file, prepare, expectExt, magicOk) => {
    const page = await ctx.newPage();
    await page.route('**/api/media/ticket', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const t = mintTicket({ secret, op: body.op, maxBytes: 1024 ** 3 });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jid: t.jid, ticket: t.ticket, expiresAt: t.expiresAt }) });
    });
    await page.goto(site + url, { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', path.join(dir, file));
    await page.waitForSelector('select:has(option[value=balanced]), select:has(option[value=mp4])');
    if (prepare) await prepare(page);
    const t0 = Date.now();
    await page.click('button:has-text("Compress Video"), button:has-text("Convert"):not(:has-text("Video Converter"))');
    const seen = [];
    let dl = null;
    const deadline = Date.now() + 240000;
    while (Date.now() < deadline) {
      const txt = (await page.innerText('body')).replace(/\s+/g, ' ');
      const m = txt.match(/(Uploading|Converting|Downloading the result|Waiting for a free slot[^%]*?|Preparing…)\s*(\d+)%/);
      if (m) { const k = m[1].split(' ')[0] + ':' + m[2]; if (!seen.includes(k)) seen.push(k); }
      const link = await page.$('a:has-text("Download ")');
      const err = await page.$('p[role=alert]');
      if (link) { dl = link; break; }
      if (err) { console.log('  page error:', await err.innerText()); break; }
      await page.waitForTimeout(150);
    }
    const total = (Date.now() - t0) / 1000;
    let info = '';
    if (dl) {
      const dP = page.waitForEvent('download');
      await dl.click();
      const d = await dP;
      const p = await d.path();
      const buf = fs.readFileSync(p);
      info = `${d.suggestedFilename()} ${(buf.length / 1048576).toFixed(1)} MB`;
      check(`${label}: real file with the right extension (${info}) in ${total.toFixed(1)}s`, buf.length > 1000 && d.suggestedFilename().endsWith('.' + expectExt) && magicOk(buf), d.suggestedFilename());
      const sizes = await page.$$eval('.grid .font-bold', (n) => n.map((x) => x.innerText));
      console.log('    page shows sizes:', sizes.join(' | '));
    } else {
      check(`${label}: finished`, false, 'no download link');
    }
    const upl = seen.filter((s) => s.startsWith('Uploading')).length;
    const cnv = seen.filter((s) => s.startsWith('Converting')).length;
    console.log(`    progress values seen -> upload:${upl} converting:${cnv} download:${seen.filter((s) => s.startsWith('Downloading')).length}`);
    check(`${label}: a REAL progression is displayed (not a frozen button)`, upl + cnv >= (expectExt === 'mp3' ? 2 : 3), JSON.stringify(seen));
    await page.close();
  };
  const head = (b, s) => b.subarray(0, 64).toString('latin1').includes(s);
  await runOnce('compress 30 s / 20.7 MB', '/tools/video-tools/video-compressor', 's30.mp4', null, 'mp4', (b) => head(b, 'ftyp'));
  await runOnce('convert .mov (2 min) -> MP4', '/tools/video-tools/video-converter', 'clip.mov', null, 'mp4', (b) => head(b, 'ftyp'));
  await runOnce('convert -> MP3 (audio only)', '/tools/video-tools/video-converter', 's30.mp4', async (p) => { await p.selectOption('select:has(option[value=mp4])', 'mp3'); }, 'mp3', (b) => b.subarray(0, 3).toString('latin1') === 'ID3' || b[0] === 0xff);
  await runOnce('convert -> animated GIF', '/tools/video-tools/video-converter', 's30.mp4', async (p) => { await p.selectOption('select:has(option[value=mp4])', 'gif'); }, 'gif', (b) => head(b, 'GIF8'));
  await browser.close();
}

try {
  for (const [n, e] of [['chromium', chromium], ['firefox', firefox], ['webkit (Playwright WebKit, NOT real Safari)', webkit]]) await drive(n, e);
} finally {
  svc.kill();
  fs.rmSync(work, { recursive: true, force: true });
}
console.log(`\n${ok.length} passed, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
