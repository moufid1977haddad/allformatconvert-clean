// Night of 28/09 — the owner's Safari findings, checked in Chromium, Firefox and WebKit (local build):
// 1a  a result the browser cannot play shows a sentence, not a broken player (audio-converter → WMA; → WAV plays);
// 1b  the audio compressor never encodes above the source's bitrate, says so, and never shows a bigger file in green;
//     the GIF compressor says "Larger by" in amber when the GIF is already optimised;
// 1c  iPhone only: the note on how to pick the original video; the first image of a loaded video (iPhone emulated);
// 1e  barcode: the on-screen preview is the SVG enlarged, the SVG file keeps its print size in mm.
// Usage: node scripts/browser-tests/night-28-09.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [origin, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'night-'));
const mk = (file, args) => { const p = path.join(tmp, file); execFileSync(FF, ['-y', '-v', 'error', ...args, p]); return p; };
const WAV = mk('tone.wav', ['-f', 'lavfi', '-i', 'sine=f=440:d=4', '-ac', '2']);
const MEMO = mk('memo.m4a', ['-f', 'lavfi', '-i', 'anoisesrc=d=7:a=0.05', '-ac', '1', '-c:a', 'aac', '-b:a', '48k']); // like an iPhone voice memo
const MEMO24 = mk('memo24.m4a', ['-f', 'lavfi', '-i', 'anoisesrc=d=7:a=0.05', '-ac', '1', '-c:a', 'aac', '-b:a', '24k']); // MP3 at 24 kbps comes out bigger (container/frames)
const MP4 = mk('clip.mp4', ['-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p']);
const GIF = mk('tiny.gif', ['-f', 'lavfi', '-i', 'color=c=red:s=16x16:d=0.1', '-frames:v', '1']);

const engine = { chromium, firefox, webkit }[name];
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const page = async (url) => { const p = await ctx.newPage(); p.setDefaultTimeout(180000); await p.goto(origin + url, { waitUntil: 'networkidle' }); return p; };

// 1a — audio-converter: WMA (no browser plays it) → the sentence; WAV → a player
{
  const p = await page('/tools/audio-tools/audio-converter');
  await p.locator('input[type=file]').first().setInputFiles(WAV);
  for (const [fmt, playable] of [['wma', false], ['wav', true]]) {
    await p.locator('main select, select.w-full').first().selectOption(fmt);
    await p.getByRole('button', { name: /^Convert/ }).first().click();
    await p.locator(`a[download$=".${fmt}"]`).first().waitFor();
    await p.waitForTimeout(1500);
    const sentence = await p.locator('[data-no-preview]').count(), player = await p.locator('audio[data-preview]').count();
    const can = await p.evaluate((t) => document.createElement('audio').canPlayType(t), fmt === 'wma' ? 'audio/x-ms-wma' : 'audio/wav');
    if (name === 'webkit' && fmt === 'wma' && can) { console.log('SKIP webkit 1a: this WebKit answers canPlayType "' + can + '" for WMA but plays nothing — judged on a real Safari only'); break; }
    check(`1a audio-converter → ${fmt.toUpperCase()}: ${playable ? 'a player' : 'a sentence, no broken player'} (canPlayType "${can}")`, playable ? player === 1 && sentence === 0 : sentence === 1 && player === 0,
      playable ? '' : await p.locator('[data-no-preview]').innerText().catch(() => '(none)'));
  }
  await p.close();
}
// 1b — audio-compressor: a 48 kbps memo asked at 128 kbps
{
  const p = await page('/tools/audio-tools/audio-compressor');
  await p.locator('input[type=file]').first().setInputFiles(MEMO);
  await p.getByRole('button', { name: '128k', exact: true }).click();
  await p.locator('main select, select.w-full').first().selectOption('mp3');
  await p.getByRole('button', { name: /Compress Audio/ }).click();
  await p.locator('a[download]').first().waitFor();
  const capped = await p.locator('[data-capped]').innerText().catch(() => '');
  const saved = p.locator('[data-saved]');
  const cls = await saved.getAttribute('class'), txt = await saved.innerText();
  const larger = await p.locator('[data-larger]').count();
  check('1b audio-compressor: encoded at the source\'s bitrate, not 128 kbps, and says so', /already at about 4\d kbps, so it was encoded at 4\d kbps instead of 128/.test(capped), capped);
  check('1b audio-compressor: a bigger result is never green, and the page says to keep the original', larger ? !/green/.test(cls) && /Larger by/.test(await p.locator('[data-saved]').locator('..').innerText()) : /green/.test(cls), `${txt} · larger box: ${larger} · ${cls}`);
  // a 24 kbps memo: even at its own bitrate, MP3 comes out bigger → said, amber, the original recommended
  await p.locator('input[type=file]').first().setInputFiles(MEMO24);
  await p.getByRole('button', { name: /Compress Audio/ }).click();
  await p.waitForFunction(() => /24 kbps/.test(document.querySelector('[data-capped]')?.textContent || ''));
  const big = await p.locator('[data-larger]').innerText().catch(() => '');
  const lab = await p.locator('[data-saved]').locator('..').innerText();
  const dl = await p.locator('a[download]').first().innerText();
  check('1b audio-compressor: still bigger at the source bitrate → "Larger by" in amber, keep your original, download only "anyway"', /already well compressed/.test(big) && /keep your original/.test(big) && /Larger by/.test(lab) && /amber/.test(await p.locator('[data-saved]').getAttribute('class')) && /anyway/.test(dl), `${lab.split('\n').join(' ')} · ${dl}`);
  // a WAV source: a real saving, green, no cap
  await p.locator('input[type=file]').first().setInputFiles(WAV);
  await p.getByRole('button', { name: /Compress Audio/ }).click();
  await p.waitForFunction(() => document.querySelector('[data-saved]') && !document.querySelector('[data-capped]'));
  check('1b audio-compressor: WAV source → a real saving in green, no cap', /green/.test(await p.locator('[data-saved]').getAttribute('class')) && (await p.locator('[data-larger]').count()) === 0, await p.locator('[data-saved]').innerText());
  await p.close();
}
// 1b — gif-compressor on an already optimal 16×16 GIF, at 100 %
{
  const p = await page('/tools/gif-tools/gif-compressor');
  await p.locator('input[type=file]').first().setInputFiles(GIF);
  await p.locator('input[type=range]').evaluate((e) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, '100'); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.getByRole('button', { name: /^Compress$/ }).click();
  await p.locator('[data-saved]').waitFor();
  const cls = await p.locator('[data-saved]').getAttribute('class'), box = await p.locator('[data-larger]').count();
  const label = await p.locator('[data-saved]').locator('..').innerText();
  check('1b gif-compressor: "Larger by" in amber + keep-original box when it did not shrink, else "Saved" in green', box ? /Larger by/.test(label) && /amber/.test(cls) : /Saved/.test(label) && /green/.test(cls), label.replace(/\n/g, ' '));
  await p.close();
}
// 1c — the iPhone note: absent on a desktop browser, present with an iPhone user-agent
{
  const p = await page('/tools/video-tools/video-trimmer');
  check('1c desktop: no iPhone note', (await p.locator('[data-ios-original-note]').count()) === 0);
  await p.close();
  const ictx = await b.newContext({ userAgent: devices['iPhone 13'].userAgent });
  const ip = await ictx.newPage(); ip.setDefaultTimeout(60000);
  for (const url of ['/tools/video-tools/video-trimmer', '/tools/video-tools/video-compressor', '/tools/image-tools/image-compressor']) {
    await ip.goto(origin + url, { waitUntil: 'networkidle' });
    const t = await ip.locator('[data-ios-original-note]').innerText().catch(() => '');
    check(`1c iPhone: note on ${url.split('/').pop()}`, /Save to Files/.test(t) && /Choose Files/.test(t), t.slice(0, 80));
  }
  // first image of a loaded video, iPhone emulated (the module seeks to 0.001 s once the metadata is in)
  if (name !== 'webkit') { // this WebKit decodes no video at all
    await ip.goto(origin + '/tools/video-tools/video-trimmer', { waitUntil: 'networkidle' });
    await ip.locator('input[type=file]').first().setInputFiles(MP4);
    const st = await ip.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 2 && v.currentTime > 0 ? { t: v.currentTime, preload: v.preload } : null; }, null, { timeout: 30000 }).then((h) => h.jsonValue(), () => null);
    check('1c iPhone: the loaded video is placed on its first image (0.001 s), preload=metadata', st && Math.abs(st.t - 0.001) < 0.0005 && st.preload === 'metadata', JSON.stringify(st));
  }
  await ictx.close();
}
// 1e — barcode: SVG enlarged on screen, file still in mm
{
  const p = await page('/tools/qr-barcodes-tools/barcode-generator');
  await p.locator('#bc-type').selectOption('ean13');
  await p.locator('#bc-text').fill('590123412345');
  await p.getByRole('button', { name: 'Generate Barcode' }).click();
  const img = p.locator('img[data-preview-svg]');
  await img.waitFor();
  const w = await img.evaluate((e) => e.getBoundingClientRect().width);
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[data-format="svg"]').click()]);
  const head = fs.readFileSync(await d.path(), 'utf8').slice(0, 200);
  check('1e barcode: preview shown ≥ 300 px wide (SVG enlarged), the SVG file keeps its size in mm', w >= 300 && /width="[\d.]+mm"/.test(head), `${Math.round(w)} px · ${head.match(/width="[^"]+"/)?.[0]}`);
  await p.close();
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${name})`);
process.exit(fails ? 1 : 0);
