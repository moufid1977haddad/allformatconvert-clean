// Real audio-converter page, one output format, one real file: does a playable file come out?
// Usage: node scripts/browser-tests/audio-converter-format.mjs <origin or share URL> <file> <format label> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const [entry, file, label] = process.argv.slice(2);
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
const logs = []; p.on('console', (m) => logs.push(m.text()));
if (entry.includes('_vercel_share')) await p.goto(entry);
await p.goto(new URL(entry).origin + '/tools/audio-tools/audio-converter', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').setInputFiles(file);
const sel = p.locator('select', { has: p.locator('option', { hasText: label }) }).first();
await sel.selectOption({ label });
await p.getByRole('button', { name: /^Convert/ }).click();
const link = p.getByRole('link', { name: /Download/ });
const failed = p.locator('text=/failed|error/i').first();
await Promise.race([link.waitFor({ timeout: 240000 }), failed.waitFor({ timeout: 240000 })]).catch(() => {});
if (await link.count()) {
  const [dl] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const dest = path.join(os.tmpdir(), 'ac-' + dl.suggestedFilename()); await dl.saveAs(dest);
  const head = fs.readFileSync(dest).subarray(0, 40);
  console.log('OK', label, dl.suggestedFilename(), fs.statSync(dest).size, 'B', 'magic', JSON.stringify(head.subarray(0, 4).toString('latin1')), head.includes(Buffer.from('OpusHead')) ? 'OpusHead' : '', '->', dest);
} else {
  console.log('FAIL', label, '|', (await failed.innerText().catch(() => '')).slice(0, 200), '|', logs.filter((l) => /opus|Error|error|memory/i.test(l)).slice(-5).join(' || ').slice(0, 600));
}
await b.close();
