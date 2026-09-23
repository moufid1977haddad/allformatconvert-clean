// Real image-resizer page: aspect lock, format kept, percentage mode. Every download reopened with sharp.
// Usage: node scripts/browser-tests/image-resizer.mjs <origin or share URL> <image>
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
const [entry, file] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
if (entry.includes('_vercel_share')) await p.goto(entry);
await p.goto(new URL(entry).origin + '/tools/image-tools/image-resizer', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').setInputFiles(file);
const src = await sharp(file).metadata();
let fails = 0;
async function run(name, setup, expectW, expectH) {
  await setup();
  await p.getByRole('button', { name: 'Resize', exact: true }).click();
  const link = p.getByRole('link', { name: 'Download' });
  await link.waitFor({ timeout: 30000 });
  const [dl] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const dest = file + '.resized-' + dl.suggestedFilename(); await dl.saveAs(dest);
  const m = await sharp(dest).metadata();
  const ok = m.width === expectW && m.height === expectH && m.format === src.format;
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', name, `${src.width}x${src.height} ${src.format} ${fs.statSync(file).size} B ->`, `${m.width}x${m.height} ${m.format} ${fs.statSync(dest).size} B`, dl.suggestedFilename());
}
await run('width 879, proportions locked', async () => { await p.getByLabel('Width (px)').fill('879'); }, 879, Math.round(879 * src.height / src.width));
await run('by percentage, 50% smaller', async () => { await p.getByRole('button', { name: 'By percentage' }).click(); await p.getByRole('button', { name: '50% smaller' }).click(); }, Math.round(src.width / 2), Math.round(src.height / 2));
await b.close(); process.exit(fails ? 1 : 0);
