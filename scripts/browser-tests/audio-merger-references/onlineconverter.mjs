// Research probe (26/09/2026), run from a folder holding fx/a.flac, fx/b.flac... (see RAPPORT-audio-merger-format-sortie.md).
import { chromium } from '@playwright/test';
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://www.onlineconverter.com/merge-audio', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(3000);
await p.locator('input[type=file]').nth(0).setInputFiles('fx/a.flac'); await p.locator('input[type=file]').nth(1).setInputFiles('fx/b.flac');
await p.getByRole('button', { name: 'Convert' }).or(p.locator('input[value=Convert]')).first().click();
const link = p.getByText(/Download Now/i).first(); await link.waitFor({ timeout: 180000 });
const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), link.click()]);
await d.saveAs('outoc_' + d.suggestedFilename()); console.log('saved', d.suggestedFilename());
await b.close();
