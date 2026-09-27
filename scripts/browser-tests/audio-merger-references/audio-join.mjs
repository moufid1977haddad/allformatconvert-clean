// Research probe (26/09/2026), run from a folder holding fx/a.flac, fx/b.flac... (see RAPPORT-audio-merger-format-sortie.md).
import { chromium } from '@playwright/test';
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://audio-join.com/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(3000);
await p.locator('input[type=file]').first().setInputFiles(['fx/a.flac', 'fx/b.flac']); await p.waitForTimeout(8000);
const dump = () => p.evaluate(() => [...document.querySelectorAll('select')].filter(s=>s.offsetParent!==null).map(s => (s.name||s.id) + ' [' + (s.selectedOptions[0]?.text||'') + '] = ' + [...s.options].map(o=>o.text.trim()).join(' | ')).join('\n'));
for (const f of ['OPUS', 'OGG', 'AAC', 'M4A — Apple / iTunes / iPhone', 'WAV', 'FLAC']) { await p.locator('select[name=ofmt], #ofmt').first().selectOption({ label: f }); await p.waitForTimeout(500); console.log('--', f); console.log(await dump()); }
await p.locator('select[name=ofmt], #ofmt').first().selectOption({ label: 'OPUS' });
const btn = p.getByRole('button', { name: /join|merge/i }).first(); console.log('button', await btn.innerText());
await btn.click();
const dl = p.locator('a[download]').or(p.getByRole('button', { name: /download/i })).first(); await dl.waitFor({ timeout: 120000 });
const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), dl.click()]);
await d.saveAs('outaj_' + d.suggestedFilename()); console.log('saved', d.suggestedFilename());
await b.close();
