// Barcode Generator SVG (owner's iPhone, 30/09: it opened tiny, at its 38 mm print size). The downloaded file is
// opened ON ITS OWN in the browser (as Files / Safari do): it must fill the window; printed (print media) it must keep
// its exact size in mm; and it must still scan (zxing-cpp through the site's own reader is covered by
// barcode-generator.mjs). Usage: node scripts/browser-tests/barcode-svg-open.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const eng = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const b = await eng.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
await p.goto(origin + '/tools/qr-barcodes-tools/barcode-generator', { waitUntil: 'networkidle' });
await p.locator('#bc-type').selectOption('ean13'); await p.locator('#bc-text').fill('5901234123457'); await p.getByRole('button', { name: 'Generate Barcode' }).click();
const svgBtn = p.locator('a[data-format="svg"]');
await svgBtn.waitFor({ timeout: 60000 });
const [dl] = await Promise.all([p.waitForEvent('download'), svgBtn.click()]);
const svg = fs.readFileSync(await dl.path(), 'utf8');
const mm = svg.match(/<svg[^>]*\swidth="([\d.]+)mm"[^>]*\sheight="([\d.]+)mm"/);
check('file keeps its print size in mm', !!mm, mm ? `${mm[1]} x ${mm[2]} mm` : svg.slice(0, 200));
const v = await ctx.newPage();
await v.setContent(''); await v.goto('about:blank');
const f = `${process.env.TEMP || '/tmp'}/barcode-open-test.svg`; fs.writeFileSync(f, svg);
await v.goto('file:///' + f.replace(/\\/g, '/'));
const screen = await v.evaluate(() => { const r = document.documentElement.getBoundingClientRect(); return [r.width, r.height, innerWidth]; });
check('opened on its own (390 px wide phone window): fills the width', screen[0] >= 380, `root ${screen[0].toFixed(0)} x ${screen[1].toFixed(0)} px`);
await v.emulateMedia({ media: 'print' });
const print = await v.evaluate(() => document.documentElement.getBoundingClientRect().width);
const want = (Number(mm?.[1]) * 96) / 25.4;
check('print media: exact size in mm', Math.abs(print - want) < 1, `${print.toFixed(1)} px, want ${want.toFixed(1)} px (${mm?.[1]} mm)`);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${eng.name()})`); process.exit(fails ? 1 : 0);
