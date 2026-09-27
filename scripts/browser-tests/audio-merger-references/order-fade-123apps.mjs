// Research probe (26/09/2026, order + crossfade): 123apps Audio Joiner, 3 files, FLAC out, in one of these modes:
//   default  - as the page sets it up (crossfade icons on)
//   nofade   - every active crossfade icon clicked off
//   reorder  - the first track moved down once with its arrow
//   fadeall  - fade-in of track 1 and fade-out of the last track clicked on as well
// Usage: node order-fade-123apps.mjs <mode> <outDir> <file1> <file2> <file3>
import { chromium } from '@playwright/test';
import path from 'node:path';
const [mode, out, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://audio-joiner.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.locator('input[type=file]').first().setInputFiles(files);
await p.getByText('Format:').first().waitFor({ timeout: 60000 }); await p.waitForTimeout(6000);
const state = () => p.evaluate(() => [...document.querySelectorAll('.track-name-out')].map((n, i) => {
  const fades = [...document.querySelectorAll('.track-fade')][i];
  return `${n.innerText.replace(/\s+/g, ' ')} [${[...(fades?.querySelectorAll('.btn-fade') || [])].map((f) => f.className.replace('btn-fade ', '')).join(', ')}]`;
}));
console.log('before:', await state());
if (mode === 'nofade') {
  // The track list re-renders after each click: take the first active icon each time.
  for (let n = 0; n < 10 && (await p.locator('.btn-fade.fade-cross.active').count()) > 0; n++) {
    await p.locator('.btn-fade.fade-cross.active').first().click(); await p.waitForTimeout(900);
  }
}
if (mode === 'fadeall') {
  await p.locator('.btn-fade.fade-in').first().click(); await p.waitForTimeout(700);
  await p.locator('.btn-fade.fade-out').last().click({ force: true }).catch((e) => console.log('fade-out click:', e.message.split('\n')[0]));
  await p.waitForTimeout(700);
}
if (mode === 'reorder') {
  await p.locator('.track-controls .down').first().click(); await p.waitForTimeout(1500);
}
await p.screenshot({ path: path.join(out, `123apps-${mode}.png`) });
console.log('after:', await state());
console.log('total shown:', await p.evaluate(() => (document.body.innerText.match(/\d\d:\d\d\.\d\/\d\d:\d\d\.\d/) || [''])[0]));
await p.getByText('Format:').first().click(); await p.waitForTimeout(800);
await p.getByText('flac', { exact: true }).last().click(); await p.waitForTimeout(800);
await p.getByText('Join', { exact: true }).click();
// Either the file downloads by itself, or a "Done!" box offers a Download button.
const dlBtn = p.getByText('Download', { exact: true }).first();
let d = await Promise.race([p.waitForEvent('download', { timeout: 240000 }), dlBtn.waitFor({ timeout: 240000 }).then(() => null)]);
if (!d) [d] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), dlBtn.click()]);
const f = path.join(out, `123apps-${mode}.flac`); await d.saveAs(f); console.log('saved', f);
await b.close();
