// Research probe (26/09/2026), run from a folder holding fx/a.flac, fx/b.flac... (see RAPPORT-audio-merger-format-sortie.md).
import { chromium } from '@playwright/test';
const [tag, doExport, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
const p = await ctx.newPage();
await p.goto('https://clideo.com/merge-audio', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.locator('input[type=file]').first().setInputFiles(files);
await p.getByText('Export', { exact: true }).waitFor({ timeout: 120000 }); await p.waitForTimeout(6000);
const fmtTxt = await p.getByText(/Format —/).first().evaluate(e => e.parentElement.innerText).catch(() => '?');
console.log(tag, 'format area:', fmtTxt.replace(/\s+/g, ' '));
await p.getByText(/Format —/).first().click().catch(()=>{}); await p.waitForTimeout(1500);
await p.screenshot({ path: `clideo-${tag}.png` });
const opts = await p.evaluate(() => { const el=[...document.querySelectorAll('*')].filter(e=>e.children.length>3 && /\bAPE\b/.test(e.innerText) && /\bCAF\b/.test(e.innerText)).sort((a,b)=>a.innerText.length-b.innerText.length)[0]; return el?el.innerText.replace(/\s+/g,' '):'none'; });
console.log('options:', opts.slice(0, 800));
if (doExport === 'yes') {
  if (process.env.FMT) { await p.getByText(process.env.FMT, { exact: true }).last().click(); await p.waitForTimeout(1000); console.log('chosen', await p.getByText(/Format —/).first().evaluate(e => e.parentElement.innerText.replace(/s+/g,' '))); } else { await p.keyboard.press('Escape'); await p.waitForTimeout(500); }
  await p.getByText('Export', { exact: true }).click();
  const btn = p.getByText('Download', { exact: true }).first();
  await btn.waitFor({ timeout: 240000 });
  await p.waitForTimeout(3000); await p.screenshot({ path: 'clideo-dl.png' }); const href = await btn.evaluate(e => (e.closest('a')||e).getAttribute('href')); console.log('href', href); const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), btn.click()]);
  await d.saveAs(`outclideo_${tag}_` + d.suggestedFilename()); console.log('saved', d.suggestedFilename());
}
await b.close();
