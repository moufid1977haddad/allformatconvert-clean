// P24 (03/10): a page whose picture is JPEG 2000 (the format of many scanned archives) rendered by PDF to JPG.
// PDF.js decodes JPEG 2000, JBIG2 and CCITT fax images with WebAssembly modules fetched from `wasmUrl`; the site never
// gave it one, so such pictures were skipped and the page came out white, with only a console warning.
// Usage: node scripts/p24/pdfjs-decoders.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
const warnings = []; p.on('console', (m) => { if (/JPX|JpxImage|openjpeg|wasm/i.test(m.text())) warnings.push(m.text().slice(0, 140)); });
await p.goto(`${origin}/tools/pdf-tools/pdf-to-jpg`, { waitUntil: 'load' }); await p.waitForTimeout(1000);
await p.locator('input[type=file]').first().setInputFiles('docs/audit/fixtures-p24-jpx.pdf');
await p.getByLabel('Format').selectOption('png').catch(() => {});
await p.getByRole('button', { name: 'Convert pages' }).click();
await p.locator('[data-file-download]').first().waitFor({ timeout: 120000 });
const b64 = await p.locator('[data-file-download] a[data-download]').first().evaluate(async (a) => { const blob = await (await fetch(a.href)).blob(); return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); }); });
const st = await sharp(Buffer.from(b64, 'base64')).stats();
const spread = Math.max(...st.channels.slice(0, 3).map((c) => c.stdev));
const ok = spread > 20; // the test pattern is colourful; a white page has a spread near 0
console.log(ok ? 'PASS' : 'FAIL', `${name} JPEG 2000 picture rendered (colour spread ${spread.toFixed(1)}, white page ≈ 0)`, warnings.slice(0, 2).join(' | '));
await b.close();
process.exitCode = ok ? 0 : 1;
