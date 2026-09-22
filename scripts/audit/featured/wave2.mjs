// Wave 2 of the featured-tools audit: MP4 to GIF, GIF Maker, Audio Converter, Audio Trimmer, Voice Recorder,
// Video Trimmer, Image Upscaler, QR Scanner. (Video Converter / Compressor: scripts/browser-tests/e2e-video-remote.mjs.)
// Usage: AUDIT_FX=<dir> AUDIT_OUT=<dir> node scripts/audit/featured/wave2.mjs [toolFilter]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { openTool, upload, download, sniff, fx, OUT } from './lib.mjs';

const only = process.argv[2];
const results = [];
// Fake microphone for the voice recorder: Chromium's built-in test tone, permission auto-granted.
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 }, permissions: ['microphone'] });

async function scenario(name, fn) {
  if (only && !name.startsWith(only)) return;
  const t0 = Date.now();
  try { results.push({ scenario: name, ...(await fn()) }); }
  catch (e) { results.push({ scenario: name, exception: String(e).slice(0, 300) }); }
  results.at(-1).secs = +((Date.now() - t0) / 1000).toFixed(1);
  console.log(JSON.stringify(results.at(-1)).replace(/"dest":"[^"]*",/g, ''));
}
const alertText = async (page) => ((await page.locator('p[role=alert], p.text-red-400, p.text-red-500').count()) ? (await page.locator('p[role=alert], p.text-red-400, p.text-red-500').allInnerTexts()).join(' | ') : '');

for (const src of ['sample.mp4', 'portrait.mp4', 'four3.mp4']) {
  await scenario(`mp4-to-gif:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/gif-tools/mp4-to-gif');
    await upload(page, fx(src));
    await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1, null, { timeout: 30000 });
    await page.locator('main button, button').filter({ hasText: /Convert|GIF/ }).last().click();
    const link = page.locator('a[download]');
    await link.first().waitFor({ timeout: 120000 });
    const dl = await download(page, link.first(), `mp4-to-gif-${src}`);
    return { dl, kind: sniff(dl.dest), alert: await alertText(page), errors };
  });
}

await scenario('gif-maker', async () => {
  const { page, errors } = await openTool(ctx, '/tools/gif-tools/gif-maker');
  await upload(page, [fx('01_portrait_cheveux.jpg'), fx('02_animal_poil.jpg'), fx('06_produit_fond_blanc.jpg')]);
  await page.getByRole('button', { name: 'Create GIF' }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 120000 });
  const dl = await download(page, link, 'gif-maker');
  return { dl, kind: sniff(dl.dest), errors };
});

const FORMATS = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'opus', 'wma', 'aiff', 'alac', 'ac3'];
for (const [src, fmts] of [['clip30.m4a', FORMATS], ['clip30.mp3', ['opus', 'mp3']], ['clip30.wav', ['mp3']]]) {
  for (const fmt of fmts) {
    await scenario(`audio-converter:${src}->${fmt}`, async () => {
      const { page, errors } = await openTool(ctx, '/tools/audio-tools/audio-converter');
      await upload(page, fx(src));
      await page.locator('select:not(.goog-te-combo)').first().selectOption(fmt);
      await page.getByRole('button', { name: /^Convert/ }).click();
      const link = page.locator('a[download]');
      const outcome = await Promise.race([
        link.waitFor({ timeout: 180000 }).then(() => 'download'),
        page.locator('text=/Conversion failed/').waitFor({ timeout: 180000 }).then(() => 'error'),
      ]);
      const dl = outcome === 'download' ? await download(page, link, `audio-converter-${src}-${fmt}`) : null;
      return { outcome, dl, kind: dl && sniff(dl.dest), alert: await alertText(page), errors };
    });
  }
}

for (const src of ['clip30.mp3', 'clip30.m4a', 'clip30.wav']) {
  await scenario(`audio-trimmer:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/audio-tools/audio-trimmer');
    await upload(page, fx(src));
    await page.waitForFunction(() => document.querySelector('audio')?.duration > 0, null, { timeout: 30000 });
    const nums = page.locator('input[type=number]');
    const ranges = page.locator('input[type=range]');
    const controls = (await nums.count()) ? nums : ranges;
    const setVal = async (loc, v) => loc.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, String(val)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    }, v);
    const dur = await page.evaluate(() => document.querySelector('audio').duration);
    const [s, e] = src === 'clip30.wav' ? [20, 30] : [5, 15];
    await setVal(controls.nth(0), s);
    await setVal(controls.nth(1), e);
    await page.getByRole('button', { name: /^Trim/ }).click();
    const link = page.locator('a[download]');
    await link.waitFor({ timeout: 120000 });
    const dl = await download(page, link, `audio-trimmer-${src}`);
    return { requested: [s, e], sourceDuration: dur, dl, kind: sniff(dl.dest), errors };
  });
}

await scenario('voice-recorder', async () => {
  const { page, errors } = await openTool(ctx, '/tools/audio-tools/voice-recorder');
  await page.getByRole('button', { name: 'Start Recording' }).click();
  await page.waitForTimeout(4000);
  await page.getByRole('button', { name: 'Stop Recording' }).click();
  const dlBtn = page.getByRole('button', { name: /^Download/ }).first();
  await dlBtn.waitFor({ timeout: 20000 });
  const rec = await download(page, dlBtn, 'voice-recorder');
  let wav = null;
  const exp = page.getByRole('button', { name: /WAV/ }).first();
  if (await exp.count()) {
    await exp.click();
    const w = page.getByRole('button', { name: 'Download WAV' });
    await w.waitFor({ timeout: 30000 });
    wav = await download(page, w, 'voice-recorder-wav');
  }
  return { rec, recKind: sniff(rec.dest), wav, wavKind: wav && sniff(wav.dest), errors };
});

await scenario('video-trimmer:sample.mp4', async () => {
  const { page, errors } = await openTool(ctx, '/tools/video-tools/video-trimmer');
  await upload(page, fx('sample.mp4'));
  await page.waitForFunction(() => document.querySelector('video')?.duration > 0, null, { timeout: 30000 });
  const nums = page.locator('input[type=number]');
  const controls = (await nums.count()) ? nums : page.locator('input[type=range]');
  for (const [i, v] of [[0, 1], [1, 4]]) {
    await controls.nth(i).evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, String(val)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    }, v);
  }
  await page.getByRole('button', { name: /^Trim/ }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 180000 });
  const dl = await download(page, link, 'video-trimmer');
  return { requested: [1, 4], dl, kind: sniff(dl.dest), note: await page.locator('body').innerText().then((t) => (t.match(/key ?frame[^.]*\./i) || [''])[0]), errors };
});

await scenario('image-upscaler:x4', async () => {
  const { page, errors } = await openTool(ctx, '/tools/ai-tools/image-upscaler');
  await upload(page, fx('upscale-small.png'));
  await page.getByRole('button', { name: /^4x$/ }).click();
  await page.getByRole('button', { name: /^Upscale/ }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 60000 });
  const dl = await download(page, link, 'image-upscaler');
  return { dl, kind: sniff(dl.dest), errors };
});

for (const src of ['qr-png', 'qr-photo.jpg']) {
  await scenario(`qr-scanner:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/qr-barcodes-tools/qr-scanner');
    const file = src === 'qr-png' ? path.join(OUT, '..', 'w1', 'qr-0__qrcode.png') : fx(src);
    await upload(page, file);
    await page.waitForFunction(() => !/Scanning/.test(document.body.innerText), null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const txt = await page.locator('body').innerText();
    const decoded = await page.evaluate(() => [...document.querySelectorAll('textarea, pre, code, p')].map((e) => e.value || e.innerText).find((t) => /onlineconvertools\.com\/tools/.test(t)) || '');
    return { decoded, noCode: /No QR code found/.test(txt), errors };
  });
}

fs.writeFileSync(path.join(OUT, `wave2-results${only ? '-' + only.replace(/[^a-z0-9-]/gi, '_') : ''}.json`), JSON.stringify(results, null, 2));
await browser.close();
