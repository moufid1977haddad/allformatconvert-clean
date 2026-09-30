// P17 step 1d: the real AI Detector page on www, end to end (real Pangram call, ~$0.25): the LIGO 2016 abstract
// (called AI by the RAIDAR version in production) and one AI text. Usage: node scripts/ai-detector/www-check-p17.mjs [origin]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const origin = process.argv[2] || 'https://www.onlineconvertools.com';
const human = JSON.parse(fs.readFileSync('scripts/ai-detector/corpus/human.json', 'utf8')).find((t) => t.id === 'h-arxiv-1602.03837');
const ai = JSON.parse(fs.readFileSync('scripts/ai-detector/corpus/ai-opus.json', 'utf8'))[0];
const b = await chromium.launch();
let fails = 0;
for (const [label, t, want] of [['LIGO 2016 abstract (human)', human, 'human'], [`${ai.id} (AI)`, ai, 'ai']]) {
  const p = await b.newPage();
  await p.goto(origin + '/tools/ai-tools/ai-detector', { waitUntil: 'networkidle' });
  await p.getByPlaceholder('Paste text to analyze...').fill(t.text);
  const declared = await p.locator('text=words per analysis').first().textContent();
  await p.getByRole('button', { name: 'Detect AI Content' }).click();
  await p.locator('[data-verdict], p.text-red-400').first().waitFor({ timeout: 60000 });
  const verdict = await p.locator('[data-verdict]').getAttribute('data-verdict').catch(() => null);
  const shares = verdict ? await p.locator('[data-shares]').innerText() : await p.locator('p.text-red-400').first().innerText();
  const ok = verdict === want;
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', label, '->', verdict, '|', shares.replace(/\s+/g, ' '), '|', declared.replace(/\s+/g, ' '));
  await p.close();
}
await b.close();
process.exit(fails ? 1 : 0);
