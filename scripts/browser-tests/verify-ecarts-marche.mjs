// Production verification of the "écarts marché" work: the REAL pages in a REAL browser, with real files,
// every download reopened and measured. Free operations only (rule 8: paid tools were proven on a preview).
// Usage: AUDIT_FX=<fixtures dir> node scripts/browser-tests/verify-ecarts-marche.mjs <origin> [--only=name,name]
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const origin = process.argv[2];
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const FX = process.env.AUDIT_FX;
const fx = (n) => path.join(FX, n);
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-em-'));
const browser = await chromium.launch();
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { cond ? pass++ : fail++; console.log(cond ? 'PASS' : 'FAIL', name, '|', detail); };

async function page(p) { const ctx = await browser.newContext({ acceptDownloads: true }); const pg = await ctx.newPage(); await pg.goto(origin + p, { waitUntil: 'networkidle' }); return { pg, ctx }; }
async function download(pg, link, prefix) {
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 300000 }), link.click()]);
  const dest = path.join(out, prefix + '-' + dl.suggestedFilename()); await dl.saveAs(dest); return dest;
}

const tests = {
  async 'pdf-compress'() {
    for (const [file, level, max] of [['arxiv-attention.pdf', 'Recommended', 0.65], ['big-staged.pdf', 'Extreme', 0.5]]) {
      const { pg, ctx } = await page('/tools/pdf-tools/pdf-compress');
      await pg.locator('input[type=file]').setInputFiles(fx(file));
      await pg.locator('label', { hasText: level }).first().click();
      await pg.getByRole('button', { name: 'Compress PDF' }).click();
      const link = pg.getByRole('link', { name: 'Download' });
      await link.waitFor({ timeout: 300000 });
      const dest = await download(pg, link, 'pdfc');
      const a = fs.statSync(fx(file)).size, b = fs.statSync(dest).size;
      ok(`pdf-compress ${level} ${file}`, fs.readFileSync(dest).subarray(0, 5).toString() === '%PDF-' && b < a * max, `${a} -> ${b} B (${((1 - b / a) * 100).toFixed(1)}%)`);
      await ctx.close();
    }
  },
  async 'image-compressor'() {
    const { pg, ctx } = await page('/tools/image-tools/image-compressor');
    await pg.locator('input[type=file]').setInputFiles([fx('02_animal_poil.jpg'), fx('transparent.png')]);
    await pg.getByRole('button', { name: /^Compress/ }).click();
    await pg.waitForFunction(() => !document.body.innerText.includes('Compressing…'), null, { timeout: 180000 });
    for (const [i, file, fmt] of [[0, '02_animal_poil.jpg', 'jpeg'], [1, 'transparent.png', 'png']]) {
      const link = pg.locator('li').nth(i).getByRole('link', { name: 'Download' });
      const dest = await download(pg, link, 'imgc');
      const m = await sharp(dest).metadata();
      ok(`image-compressor ${file}`, m.format === fmt && fs.statSync(dest).size < fs.statSync(fx(file)).size, `${fs.statSync(fx(file)).size} -> ${fs.statSync(dest).size} B, ${m.format}${m.hasAlpha ? ' with alpha' : ''}`);
    }
    await ctx.close();
  },
  async 'image-upscaler'() {
    const { pg, ctx } = await page('/tools/ai-tools/image-upscaler');
    await pg.locator('input[type=file]').setInputFiles(fx('upscale-small.png'));
    await pg.getByRole('button', { name: /^4×/ }).click();
    await pg.getByRole('button', { name: 'Upscale Image' }).click();
    const link = pg.getByRole('link', { name: 'Download' });
    await link.waitFor({ timeout: 300000 });
    const dest = await download(pg, link, 'up');
    const m = await sharp(dest).metadata(), s = await sharp(fx('upscale-small.png')).metadata();
    ok('image-upscaler x4 (AI, staged)', m.width === s.width * 4 && m.height === s.height * 4 && m.format === 'png', `${s.width}x${s.height} -> ${m.width}x${m.height} ${m.format}`);
    await ctx.close();
  },
  async 'gif'() {
    for (const [tool, file] of [['mp4-to-gif', 'portrait.mp4'], ['mov-to-gif', 'sample.mov']]) {
      const { pg, ctx } = await page('/tools/gif-tools/' + tool);
      await pg.locator('input[type=file]').setInputFiles(fx(file));
      await pg.getByLabel('Length (seconds)').fill('3');
      await pg.getByRole('button', { name: 'Make GIF' }).click();
      const link = pg.getByRole('link', { name: /Download GIF/ });
      await link.waitFor({ timeout: 300000 });
      const dest = await download(pg, link, 'gif');
      const m = await sharp(dest, { animated: true }).metadata();
      const src = file === 'portrait.mp4' ? 1080 / 1920 : 16 / 9;
      ok(`${tool} ${file}`, m.format === 'gif' && Math.abs(m.width / m.pageHeight - src) < 0.02 && m.pages >= 25, `${m.width}x${m.pageHeight}, ${m.pages} frames, ${fs.statSync(dest).size} B`);
      await ctx.close();
    }
  },
  async 'image-resizer'() {
    const { pg, ctx } = await page('/tools/image-tools/image-resizer');
    await pg.locator('input[type=file]').setInputFiles(fx('02_animal_poil.jpg'));
    await pg.getByLabel('Width (px)').fill('879');
    await pg.getByRole('button', { name: 'Resize', exact: true }).click();
    const link = pg.getByRole('link', { name: 'Download' });
    await link.waitFor({ timeout: 60000 });
    const dest = await download(pg, link, 'rs');
    const m = await sharp(dest).metadata();
    ok('image-resizer 879 px, proportions locked, JPEG kept', m.width === 879 && m.height === 1000 && m.format === 'jpeg', `${m.width}x${m.height} ${m.format} ${fs.statSync(dest).size} B`);
    await ctx.close();
  },
  async 'opus'() {
    const { pg, ctx } = await page('/tools/audio-tools/audio-converter');
    await pg.locator('input[type=file]').setInputFiles(fx('clip10.mp3'));
    await pg.locator('select', { has: pg.locator('option', { hasText: 'Opus' }) }).first().selectOption({ label: 'Opus' });
    await pg.getByRole('button', { name: /^Convert/ }).click();
    const link = pg.getByRole('link', { name: /Download/ });
    await link.waitFor({ timeout: 300000 });
    const dest = await download(pg, link, 'opus');
    const b = fs.readFileSync(dest);
    ok('audio-converter Opus (libopus on the service)', b.subarray(0, 4).toString() === 'OggS' && b.includes(Buffer.from('OpusHead')) && b.includes(Buffer.from('libopus')), `${b.length} B, encoder tag ${b.includes(Buffer.from('libopus')) ? 'libopus' : 'NOT libopus'}`);
    await ctx.close();
  },
};

for (const [name, fn] of Object.entries(tests)) {
  if (only.length && !only.includes(name)) continue;
  try { await fn(); } catch (e) { fail++; console.log('FAIL', name, '|', String(e).split('\n')[0].slice(0, 200)); }
}
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
