// Audio Waveform and Audio Equalizer with formats the browser cannot decode (WMA, AC3): until 28/09/2026 both
// accepted them and failed with "Unable to decode audio data". Now ffmpeg.wasm decodes them (app/lib/decodeAudio.js).
// Waveform: no error, the PNG downloads and is not blank. Equalizer: "Export as WAV" gives a WAV of the file's length.
// Usage: node scripts/browser-tests/audio-decode-fallback.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'decfb-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const SRC = [['wma', ['-c:a', 'wmav2']], ['ac3', ['-c:a', 'ac3']]].map(([ext, c]) => { const f = path.join(tmp, `tone.${ext}`); execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5', ...c, f]); return [ext, f]; });

const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
for (const [ext, f] of SRC) {
  { // waveform
    const p = await ctx.newPage(); await p.goto(origin + '/tools/audio-tools/audio-waveform', { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').setInputFiles(f);
    await p.waitForTimeout(8000);
    const err = (await p.locator('.text-red-400').allTextContents()).join(' ');
    const btn = p.getByRole('button', { name: 'Download PNG' });
    let blank = null;
    if (!err && await btn.count()) {
      const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), btn.click()]).catch(() => [null]);
      if (d) { const st = await sharp(fs.readFileSync(await d.path())).stats(); blank = st.channels[0].min > 200; } // a drawn waveform has dark pixels
    }
    check(`waveform .${ext}: drawn, PNG downloaded and not blank`, !err && blank === false, err || `blank: ${blank}`);
    await p.close();
  }
  { // equalizer export
    const p = await ctx.newPage(); await p.goto(origin + '/tools/audio-tools/audio-equalizer', { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').setInputFiles(f);
    await p.getByRole('button', { name: 'Export as WAV' }).click();
    const a = await p.locator('a[download]').first().waitFor({ timeout: 90000 }).then(() => true).catch(() => false);
    if (!a) { check(`equalizer .${ext}: WAV exported`, false, (await p.locator('.text-red-400').allTextContents()).join(' ')); await p.close(); continue; }
    const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').first().click()]);
    const out = path.join(tmp, `${browserName}-${ext}-${d.suggestedFilename()}`); await d.saveAs(out);
    const dur = Number(execFileSync(FF.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
    check(`equalizer .${ext}: ${d.suggestedFilename()} lasts ${dur.toFixed(2)} s for 5 s`, /\.wav$/.test(out) && Math.abs(dur - 5) < 0.1);
    await p.close();
  }
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);
