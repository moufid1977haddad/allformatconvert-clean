// Research probe (26/09/2026), run from a folder holding fx/a.flac, fx/b.flac... (see RAPPORT-audio-merger-format-sortie.md).
import { chromium } from '@playwright/test';
const [fmt, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
const p = await ctx.newPage();
await p.goto('https://audio-joiner.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.locator('input[type=file]').first().setInputFiles(files);
await p.getByText('Format:').first().waitFor({ timeout: 60000 }); await p.waitForTimeout(5000);
await p.getByText('Format:').first().click(); await p.waitForTimeout(1500);
await p.screenshot({ path: 'fmt.png' });
if (fmt !== 'none') {
  await p.getByText(fmt, { exact: true }).last().click(); await p.waitForTimeout(1000);
  await p.screenshot({ path: 'fmt2.png' });
  await p.getByText('Join', { exact: true }).click();
  const d = await p.waitForEvent('download', { timeout: 180000 }).catch(() => null);
  if (!d) { await p.screenshot({ path: 'after.png' }); const dl = p.getByText(/Download|Save/).first(); const [d2] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), dl.click()]); await d2.saveAs('out123_' + d2.suggestedFilename()); console.log('saved', d2.suggestedFilename()); }
  else { await d.saveAs('out123_' + d.suggestedFilename()); console.log('saved', d.suggestedFilename()); }
}
await b.close();
