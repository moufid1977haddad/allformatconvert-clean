// P31 (03/10), point 7a: does Image Converter's Quality slider change a PNG output? Converts the same photo to PNG
// at 10 % and at 100 % and compares the bytes (SHA-256). Also Image Compressor (PNG keeps PNG): 10 % vs 100 %, where
// the value drives the colour palette. Usage: node scripts/p31/png-quality-measure.mjs <origin> [--compressor]
import { chromium } from '@playwright/test';
import crypto from 'node:crypto';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const JPG = 'docs/audit/fixtures-safari/safari-small-800x600.jpg';
const PNG = 'scripts/audit/fixtures/files/sample.png';
const b = await chromium.launch();
const sha = (arr) => crypto.createHash('sha256').update(Buffer.from(arr)).digest('hex').slice(0, 16);

async function converter(q) {
  const p = await b.newPage();
  await p.goto(`${origin}/tools/image-tools/image-converter`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(JPG);
  await p.locator('select').filter({ has: p.locator('option[value="png"]') }).first().selectOption('png');
  const slider = p.getByRole('slider', { name: 'Quality (%)' });
  const shown = await slider.count();
  if (shown) await slider.fill(String(q));
  await p.getByRole('button', { name: /^Convert \d+ file/ }).click();
  const row = p.locator('[data-file-download]').first();
  await row.waitFor({ timeout: 60000 });
  const bytes = await row.locator('a[data-download]').evaluate(async (a) => Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer())));
  await p.close();
  return { q, sliderShown: !!shown, size: bytes.length, sha: sha(bytes) };
}
async function compressor(q) {
  const p = await b.newPage();
  await p.goto(`${origin}/tools/image-tools/image-compressor`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(PNG);
  await p.locator('#quality').fill(String(q));
  await p.getByRole('button', { name: /^Compress/ }).click();
  await p.waitForFunction(() => /Compressing…/.test(document.body.innerText) === false && (document.querySelector('[data-file-download]') || /Already well compressed|lossless/.test(document.body.innerText)), null, { timeout: 60000 });
  const row = p.locator('[data-file-download]').first();
  const bytes = (await row.count()) ? await row.locator('a[data-download]').evaluate(async (a) => Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer()))) : [];
  await p.close();
  return { q, size: bytes.length, sha: bytes.length ? sha(bytes) : 'not smaller: nothing offered' };
}
const rows = process.argv.includes('--compressor') ? [await compressor(10), await compressor(100)] : [await converter(10), await converter(100)];
for (const r of rows) console.log(JSON.stringify(r));
console.log(rows[0].sha === rows[1].sha ? 'IDENTICAL bytes at 10 % and 100 %' : 'DIFFERENT bytes');
await b.close();
