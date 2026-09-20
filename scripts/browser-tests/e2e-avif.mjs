// AVIF through the REAL image-converter page, in Chromium, Firefox and WebKit:
// choose AVIF, convert a real photo-like PNG, and check the downloaded file is a
// genuine AVIF (ISO-BMFF "ftyp avif" box), is smaller than the PNG, and that a
// browser able to decode AVIF can actually display it.
// Usage: node scripts/browser-tests/e2e-avif.mjs <siteUrl> <png file>
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';

const [site, png] = process.argv.slice(2);
let failed = 0;
const check = (name, cond, detail = '') => { if (!cond) failed++; console.log(cond ? '  PASS' : '  FAIL', name, cond ? '' : detail); };

for (const [name, eng] of [['chromium', chromium], ['firefox', firefox], ['webkit (Playwright WebKit, NOT real Safari)', webkit]]) {
  console.log(`\n===== ${name} =====`);
  const b = await eng.launch();
  const ctx = await b.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(site + '/tools/image-tools/image-converter', { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', png);
  const hasOffscreen = await page.evaluate(() => typeof OffscreenCanvas !== 'undefined');
  if (!hasOffscreen) { console.log('  SKIPPED: this browser build has no OffscreenCanvas (image-converter cannot run at all there, for any format; real Safari 16.4+ has it)'); await b.close(); continue; }
  const SEL = 'select:has(option[value=avif])';
  await page.waitForSelector(SEL);
  const disabled = await page.$eval(`${SEL} option[value=avif]`, (o) => o.disabled);
  check('AVIF option is enabled', !disabled);
  await page.selectOption(SEL, 'avif');
  const t0 = Date.now();
  await page.click('button:has-text("Convert")');
  await page.waitForSelector('button:has-text("Download")', { timeout: 120000 });
  const secs = (Date.now() - t0) / 1000;
  const dl = page.waitForEvent('download');
  await page.click('button:has-text("Download")');
  const d = await dl;
  const buf = fs.readFileSync(await d.path());
  const head = buf.subarray(4, 12).toString('latin1');
  check(`download is named .avif (${d.suggestedFilename()})`, d.suggestedFilename().endsWith('.avif'));
  check(`content is a real AVIF (ftyp box "${head}")`, /^ftyp(avif|avis)$/.test(head));
  check(`smaller than the source PNG (${(buf.length / 1024).toFixed(0)} KB vs ${(fs.statSync(png).size / 1024).toFixed(0)} KB) in ${secs.toFixed(1)}s`, buf.length < fs.statSync(png).size);
  const decodes = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/avif;base64,' + b64;
    try { await img.decode(); return { ok: true, w: img.naturalWidth, h: img.naturalHeight }; } catch (e) { return { ok: false, err: String(e) }; }
  }, buf.toString('base64'));
  console.log('    browser decode of the produced file:', JSON.stringify(decodes));
  if (name.startsWith('chromium') || name.startsWith('firefox')) check('the browser itself decodes the produced AVIF', decodes.ok);
  await b.close();
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
