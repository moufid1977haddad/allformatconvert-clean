// Real-browser probe: which image type does each engine REALLY produce when asked?
// Also drives the live image-converter UI (option disabled state + real download).
// Run: node scripts/browser-tests/probe-encoders.mjs [baseUrl]
import { chromium, firefox } from '@playwright/test';
import fs from 'node:fs';

const base = process.argv[2] || 'https://www.onlineconvertools.com';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVQYV2P8z8Dwn4EIwDiqkL4KAcT9GO0U4BxoAAAAAElFTkSuQmCC', 'base64');
fs.writeFileSync(new URL('./_probe.png', import.meta.url), png);

const probe = async () => {
  const out = {};
  for (const type of ['image/webp', 'image/avif', 'image/jpeg']) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 64, 64);
    const d = c.toDataURL(type);
    const b = await new Promise((r) => c.toBlob(r, type, 0.8));
    let off = 'n/a';
    if (typeof OffscreenCanvas !== 'undefined') {
      const o = new OffscreenCanvas(64, 64); o.getContext('2d').fillRect(0, 0, 64, 64);
      off = (await o.convertToBlob({ type, quality: 0.8 })).type;
    }
    out[type] = { toDataURL: d.slice(5, d.indexOf(';')), toBlob: b && b.type, offscreen: off };
  }
  return out;
};

for (const [name, engine] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await engine.launch();
  const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
  await page.goto(base + '/tools/image-tools/image-converter', { waitUntil: 'networkidle' });
  const version = browser.version();
  const res = await page.evaluate(probe);
  console.log(`\n== ${name} ${version}`);
  for (const [t, r] of Object.entries(res)) console.log(`  asked ${t.padEnd(11)} -> toDataURL:${r.toDataURL}  toBlob:${r.toBlob}  OffscreenCanvas:${r.offscreen}`);
  // live UI
  await page.setInputFiles('input[type=file]', new URL('./_probe.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const SEL = 'select:has(option[value=avif])';
  await page.waitForSelector(SEL);
  const opts = await page.$$eval(SEL + ' option', (os) => os.map((o) => `${o.value}${o.disabled ? '(disabled)' : ''}`));
  console.log('  UI options:', opts.join(' '), '| selected:', await page.$eval(SEL, (s) => s.value));
  for (const fmt of ['webp', 'avif']) {
    const optDisabled = await page.$eval(`${SEL} option[value=${fmt}]`, (o) => o.disabled);
    if (optDisabled) { console.log(`  ${fmt}: option disabled, nothing to convert (correct)`); continue; }
    await page.selectOption(SEL, fmt);
    await page.click('button:has-text("Convert")');
    const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await page.waitForSelector('text=Results', { timeout: 15000 }).catch(() => {});
    const err = await page.$('p.text-red-500');
    console.log(`  ${fmt}: converted; error shown: ${err ? await err.innerText() : 'none'}`);
    const btn = await page.$('button:has-text("Download")');
    if (btn) { await btn.click(); const d = await dl; if (d) { const p = await d.path(); const head = fs.readFileSync(p).subarray(0, 12); console.log(`  ${fmt}: downloaded ${d.suggestedFilename()} magic=${head.toString('latin1').replace(/[^\x20-\x7e]/g, '.')}`); } }
  }
  await browser.close();
}
fs.unlinkSync(new URL('./_probe.png', import.meta.url));
