// Proves the fixes of the featured-tools audit on a deployed site (preview or production).
// Usage: AUDIT_FX=... AUDIT_OUT=... [AUDIT_BASE=... AUDIT_SHARE_URL=...] node scripts/audit/featured/verify-fixes.mjs
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openBrowser, openTool, upload, download, sniff, fx, BASE } from './lib.mjs';

const { browser, ctx } = await openBrowser();
const out = [];
const check = (name, ok, detail) => { out.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${JSON.stringify(detail)}`); };
// Corner pixel of a downloaded JPEG, read with Python/PIL (the transparent area of transparent.png).
const corner = (file) => execFileSync('python', ['-c', `from PIL import Image;print(Image.open(r'''${file}''').convert('RGB').getpixel((5,5)))`]).toString().trim();

// 1. Compressor must refuse to hand over a heavier "compressed" file.
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-compressor');
  await upload(page, fx('lowq.jpg'));
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  await page.waitForTimeout(3000);
  const links = await page.locator('a[download]').count();
  const msg = (await page.locator('p.text-red-400').count()) ? await page.locator('p.text-red-400').innerText() : '';
  check('image-compressor refuses a larger output', links === 0 && /not smaller/.test(msg), { links, msg });
}
// 2. Compressor: normal photo still compresses, sizes shown.
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-compressor');
  await upload(page, fx('02_animal_poil.jpg'));
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 30000 });
  const shown = await page.locator('text=/→/').first().innerText();
  const dl = await download(page, link, 'fix-compressor-photo');
  check('image-compressor photo smaller + sizes shown', dl.size < fs.statSync(fx('02_animal_poil.jpg')).size && sniff(dl.dest) === 'jpg', { size: dl.size, shown });
}
// 3. Transparent PNG -> JPEG is white, not black, in both tools.
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-compressor');
  await upload(page, fx('transparent.png'));
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 30000 });
  const dl = await download(page, link, 'fix-compressor-transparent');
  const px = corner(dl.dest);
  check('image-compressor transparent -> white', px === '(255, 255, 255)', { px });
}
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-converter');
  await upload(page, fx('transparent.png'));
  await page.locator('select:not(.goog-te-combo)').first().selectOption('jpg');
  await page.getByRole('button', { name: /^Convert/ }).first().click();
  const link = page.getByRole('button', { name: /^Download/ }).last();
  await link.waitFor({ timeout: 60000 });
  const dl = await download(page, link, 'fix-converter-transparent');
  const px = corner(dl.dest);
  check('image-converter transparent -> JPG white', px === '(255, 255, 255)' && sniff(dl.dest) === 'jpg', { px });
}
// 4. Displayed counts.
{
  const res = await ctx.request.get(BASE + '/api/tool-counts');
  const counts = await res.json();
  check('/api/tool-counts total 222', counts.total === 222 && counts.counts['pdf-tools'] === 37 && counts.counts['ai-tools'] === 15, counts);
  const html = await (await ctx.request.get(BASE + '/')).text();
  check('homepage: no "225", no "190", no "No limits"', !/225\+?|\b190\b|No limits/i.test(html.replace(/rgba?\([^)]*\)/g, '')) && /222/.test(html), { has222: /222/.test(html) });
  const sm = await (await ctx.request.get(BASE + '/sitemap.xml')).text();
  const n = (sm.match(/<loc>/g) || []).length;
  check('sitemap still 240 URLs, no stubs', n === 240 && !/pdf-to-excel|pdf-to-ppt|image-generator/.test(sm), { n });
}
await browser.close();
process.exitCode = out.every((c) => c.ok) ? 0 : 1;
