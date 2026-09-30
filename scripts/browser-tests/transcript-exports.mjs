// Audio Transcriber / Audio to Text (30/09): TXT, SRT and VTT downloads from Whisper's timed segments. The route is
// played (no paid call): it answers the text and three segments, as /api/ai-transcribe does since 30/09.
// Usage: node scripts/browser-tests/transcript-exports.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const wav = path.resolve('docs/audit/fixtures-safari/safari-tone-12s.wav');
const segments = [{ start: 0, end: 2.48, text: ' Welcome to the weekly meeting.' }, { start: 2.48, end: 6.1, text: ' The website launches on Monday.' }, { start: 6.1, end: 65.25, text: ' Thank you.' }];
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
for (const [tool, prep] of [['/tools/ai-tools/audio-transcriber', null], ['/tools/audio-tools/audio-to-text', async (p) => { await p.getByRole('button', { name: /file/i }).first().click(); }]]) {
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.route('**/api/ai-transcribe', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: segments.map((s) => s.text.trim()).join(' '), segments }) }));
  await p.goto(origin + tool, { waitUntil: 'networkidle' });
  if (prep) await prep(p);
  await p.locator('input[type=file]').last().setInputFiles(wav);
  const go = p.getByRole('button', { name: /^Transcribe/ });
  if (await go.count()) await go.first().click();
  // P18: one row per file (FileDownload), its link being the file's own Download link.
  const link = (ext) => p.locator(`[data-transcript-exports] a[data-download][download$=".${ext}"]`);
  await link('srt').waitFor({ timeout: 30000 });
  const get = async (ext) => { const [d] = await Promise.all([p.waitForEvent('download'), link(ext).click()]); return { name: d.suggestedFilename(), text: fs.readFileSync(await d.path(), 'utf8') }; };
  const srt = await get('srt'), vtt = await get('vtt'), txt = await get('txt');
  check(`${tool}: SRT`, srt.name === 'safari-tone-12s.srt' && srt.text.startsWith('1\n00:00:00,000 --> 00:00:02,480\nWelcome to the weekly meeting.\n') && srt.text.includes('3\n00:00:06,100 --> 00:01:05,250\nThank you.'), JSON.stringify(srt.text.slice(0, 90)));
  check(`${tool}: VTT`, vtt.name === 'safari-tone-12s.vtt' && vtt.text.startsWith('WEBVTT\n\n00:00:00.000 --> 00:00:02.480\n'), JSON.stringify(vtt.text.slice(0, 60)));
  check(`${tool}: TXT`, txt.name === 'safari-tone-12s.txt' && txt.text.startsWith('Welcome to the weekly meeting.'), txt.name);
  await ctx.close();
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
