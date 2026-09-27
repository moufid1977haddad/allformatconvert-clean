// Research probe (26/09/2026, order + crossfade): Clideo Merge Audio, 3 files, FLAC out, in one of these modes:
//   default  - as the page sets it up
//   fade     - the "Crossfade" box ticked (anything that appears then is printed)
//   reorder  - the first clip dragged after the second one on the timeline
// Usage: node order-fade-clideo.mjs <mode> <outDir> <file1> <file2> <file3>
import { chromium } from '@playwright/test';
import path from 'node:path';
const [mode, out, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://clideo.com/merge-audio', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.locator('input[type=file]').first().setInputFiles(files);
await p.getByText('Export', { exact: true }).waitFor({ timeout: 120000 }); await p.waitForTimeout(8000);
const side = () => p.evaluate(() => document.querySelector('#vCrossfade')?.closest('div[class]')?.parentElement?.parentElement?.innerText.replace(/\s+/g, ' ') || '');
console.log('crossfade checked by default:', await p.locator('#vCrossfade').isChecked());
if (mode === 'fade') {
  await p.getByText('Crossfade', { exact: true }).click(); await p.waitForTimeout(2500);
  console.log('checked now:', await p.locator('#vCrossfade').isChecked(), '| panel:', await side());
  const extra = await p.evaluate(() => [...document.querySelectorAll('input,select,[role=slider]')].filter((e) => e.offsetParent && e.type !== 'file').map((e) => `${e.tagName} ${e.type} id=${e.id} val=${e.value} min=${e.min} max=${e.max} step=${e.step}`));
  console.log('visible inputs:', extra);
}
if (mode === 'reorder') {
  const clip = p.getByText(path.basename(files[0]), { exact: true }).last();
  const target = p.getByText(path.basename(files[1]), { exact: true }).last();
  const a = await clip.boundingBox(), t = await target.boundingBox();
  await p.mouse.move(a.x + 20, a.y + 20); await p.mouse.down(); await p.waitForTimeout(300);
  for (let i = 1; i <= 20; i++) { await p.mouse.move(a.x + 20 + ((t.x + t.width + 30 - a.x - 20) * i) / 20, a.y + 20); await p.waitForTimeout(40); }
  await p.mouse.up(); await p.waitForTimeout(2500);
  const names = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /\.flac$/.test(e.textContent.trim())).map((e) => [Math.round(e.getBoundingClientRect().x), e.textContent.trim()]).filter(([x]) => x > 0));
  console.log('timeline after drag:', names);
}
await p.screenshot({ path: path.join(out, `clideo-${mode}.png`) });
console.log('final output shown:', await p.evaluate(() => (document.body.innerText.match(/Final output\s*—\s*[\d:]+/) || [''])[0]));
await p.getByText('Export', { exact: true }).click();
const btn = p.getByText('Download', { exact: true }).first();
await btn.waitFor({ timeout: 240000 }); await p.waitForTimeout(3000);
const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), btn.click()]);
const f = path.join(out, `clideo-${mode}.flac`); await d.saveAs(f); console.log('saved', f, d.suggestedFilename());
await b.close();
