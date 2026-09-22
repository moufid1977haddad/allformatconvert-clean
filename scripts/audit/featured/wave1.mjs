// Wave 1 of the featured-tools audit: PDF merge/split/compress, image compressor/converter/resizer,
// QR generator, Video to GIF. (Background Remover and Grammar Fixer are paid calls: see wave1-paid.mjs,
// run against a preview only — interdit permanent n° 8.)
// Usage: AUDIT_FX=<dir> AUDIT_OUT=<dir> node scripts/audit/featured/wave1.mjs [toolFilter]
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser, openTool, upload, download, sniff, ext, fx, OUT } from './lib.mjs';

const only = process.argv[2];
const results = [];
const { browser, ctx } = await openBrowser();

async function scenario(name, fn) {
  if (only && !name.startsWith(only)) return;
  const t0 = Date.now();
  try {
    const r = await fn();
    results.push({ scenario: name, secs: +((Date.now() - t0) / 1000).toFixed(1), ...r });
  } catch (e) {
    results.push({ scenario: name, secs: +((Date.now() - t0) / 1000).toFixed(1), exception: String(e).slice(0, 300) });
  }
  console.log(JSON.stringify(results.at(-1)));
}

// ---------- PDF ----------
await scenario('pdf-merge', async () => {
  const { page, errors } = await openTool(ctx, '/tools/pdf-tools/pdf-merge');
  await upload(page, [fx('arxiv-attention.pdf'), fx('scan-photos.pdf')]);
  await page.getByRole('button', { name: /^Merge/ }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 60000 });
  const status = await page.locator('text=/Merged .* pages/').first().innerText().catch(() => '');
  const dl = await download(page, link, 'pdf-merge');
  return { status, dl, kind: sniff(dl.dest), errors };
});

await scenario('pdf-split', async () => {
  const { page, errors } = await openTool(ctx, '/tools/pdf-tools/pdf-split');
  await upload(page, fx('arxiv-attention.pdf'));
  await page.locator('text=/Total pages: [1-9]/').waitFor({ timeout: 30000 });
  await page.locator('input[placeholder="1-3, 4-6, 7"]').fill('1-3, 5, 14-15');
  await page.getByRole('button', { name: /^Split/ }).click();
  const links = page.locator('a[download]');
  await links.first().waitFor({ timeout: 60000 });
  const n = await links.count();
  const dls = [];
  for (let i = 0; i < n; i++) dls.push(await download(page, links.nth(i), `pdf-split-${i}`));
  return { count: n, dls: dls.map((d) => ({ ...d, kind: sniff(d.dest) })), errors };
});

for (const src of ['arxiv-attention.pdf', 'scan-photos.pdf', 'gs-optimised.pdf']) {
  await scenario(`pdf-compress:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/pdf-tools/pdf-compress');
    await upload(page, fx(src));
    await page.getByRole('button', { name: 'Compress PDF' }).click();
    const link = page.locator('a[download]');
    const outcome = await Promise.race([
      link.waitFor({ timeout: 60000 }).then(() => 'download'),
      page.locator('.bg-red-50').waitFor({ timeout: 60000 }).then(() => 'error'),
    ]);
    const shown = (await page.locator('.grid.grid-cols-3').count()) ? await page.locator('.grid.grid-cols-3').innerText() : '';
    const msg = (await page.locator('.bg-red-50').count()) ? await page.locator('.bg-red-50').innerText() : '';
    const dl = outcome === 'download' ? await download(page, link, `pdf-compress-${src}`) : null;
    return { outcome, shown: shown.replace(/\n/g, ' '), msg, inSize: fs.statSync(fx(src)).size, dl, errors };
  });
}

// ---------- Images ----------
for (const src of ['02_animal_poil.jpg', 'animal.png', 'product.png', 'lowq.jpg', 'transparent.png']) {
  await scenario(`image-compressor:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/image-tools/image-compressor');
    await upload(page, fx(src));
    await page.getByRole('button', { name: 'Compress', exact: true }).click();
    const link = page.locator('a[download]');
    const outcome = await Promise.race([
      link.waitFor({ timeout: 30000 }).then(() => 'download'),
      page.locator('text=/Could not|error/i').first().waitFor({ timeout: 30000 }).then(() => 'error'),
    ]);
    const dl = outcome === 'download' ? await download(page, link, `image-compressor-${src}`) : null;
    return { outcome, inSize: fs.statSync(fx(src)).size, dl, kind: dl && sniff(dl.dest), errors };
  });
}

for (const [src, fmt] of [['product.png', 'webp'], ['product.png', 'jpg'], ['product.png', 'avif'], ['02_animal_poil.jpg', 'png'], ['transparent.png', 'jpg'], ['lowq.jpg', 'jpg']]) {
  await scenario(`image-converter:${src}->${fmt}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/image-tools/image-converter');
    await upload(page, fx(src));
    await page.locator('select:not(.goog-te-combo)').first().selectOption(fmt);
    const convertBtn = page.getByRole('button', { name: /^Convert/ }).first();
    await convertBtn.click();
    const link = page.getByRole('button', { name: /^Download/ }).last();
    await link.waitFor({ timeout: 90000 });
    const dl = await download(page, link, `image-converter-${src}-${fmt}`);
    return { dl, kind: sniff(dl.dest), extMatches: sniff(dl.dest) === ext(dl.name), errors };
  });
}

await scenario('image-resizer:jpg-half', async () => {
  const { page, errors } = await openTool(ctx, '/tools/image-tools/image-resizer');
  await upload(page, fx('02_animal_poil.jpg'));
  await page.waitForTimeout(800);
  const w = page.locator('input[type=number]').nth(0);
  const h = page.locator('input[type=number]').nth(1);
  const before = [await w.inputValue(), await h.inputValue()];
  await w.fill('879');
  await page.waitForTimeout(200);
  const hAfterW = await h.inputValue();
  await page.getByRole('button', { name: 'Resize', exact: true }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 30000 });
  const dl = await download(page, link, 'image-resizer');
  return { before, heightAfterWidthEdit: hAfterW, dl, kind: sniff(dl.dest), inSize: fs.statSync(fx('02_animal_poil.jpg')).size, errors };
});

// ---------- QR ----------
await scenario('qr-generator', async () => {
  const { page, errors } = await openTool(ctx, '/tools/qr-barcodes-tools/qr-generator');
  const text = 'https://www.onlineconvertools.com/tools/pdf-tools/pdf-merge?utm=audit&x=é漢字';
  await page.locator('input[placeholder="Enter text or URL..."]').fill(text);
  await page.getByRole('button', { name: 'Generate QR Code' }).click();
  const links = page.locator('a[download]');
  await links.first().waitFor({ timeout: 20000 });
  const n = await links.count();
  const dls = [];
  for (let i = 0; i < n; i++) dls.push(await download(page, links.nth(i), `qr-${i}`));
  return { text, dls: dls.map((d) => ({ ...d, kind: sniff(d.dest) })), errors };
});

// ---------- GIF ----------
for (const src of ['sample.mp4', 'sample.mov']) {
  await scenario(`video-to-gif:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/gif-tools/video-to-gif');
    await upload(page, fx(src));
    await page.locator('video').waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1, null, { timeout: 30000 }).catch(() => {});
    await page.getByRole('button', { name: /Convert to GIF/ }).click();
    const link = page.locator('a[download]');
    const outcome = await Promise.race([
      link.first().waitFor({ timeout: 120000 }).then(() => 'download'),
      page.locator('p[role=alert]').waitFor({ timeout: 120000 }).then(() => 'error'),
    ]);
    const alert = (await page.locator('p[role=alert]').count()) ? await page.locator('p[role=alert]').innerText() : '';
    const dl = outcome === 'download' ? await download(page, link.first(), `video-to-gif-${src}`) : null;
    return { outcome, alert, dl, kind: dl && sniff(dl.dest), errors };
  });
}

fs.writeFileSync(path.join(OUT, `wave1-results${only ? '-' + only.replace(/[^a-z0-9-]/gi, '_') : ''}.json`), JSON.stringify(results, null, 2));
await browser.close();
