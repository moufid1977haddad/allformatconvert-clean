// P17 step 1d: the real AI Detector page on www, end to end (real Pangram call, ~$0.25): the LIGO 2016 abstract
// (called AI by the RAIDAR version in production before P17) and one AI text.
//
// Usage (from the repository folder, any time AFTER 00:00 UTC = 20:00 Toronto/Montréal in summer time):
//   node scripts/ai-detector/www-check-p17.mjs            -> https://www.onlineconvertools.com
//   node scripts/ai-detector/www-check-p17.mjs <origin>   -> another deployment
// Result lines: PASS/FAIL per text, then a summary. Exit code 0 = both verdicts right, 1 = a wrong verdict or a page
// error, 2 = not run: this connection has already used today's 2,000 free words (message shown by the site) — run it
// again after the next 00:00 UTC; nothing was charged in that case.
// Needs only Playwright's Chromium (already installed for the test benches). Reads no secret, writes nothing.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const origin = new URL(process.argv[2] || 'https://www.onlineconvertools.com').origin;
const human = JSON.parse(fs.readFileSync(path.join(here, 'corpus', 'human.json'), 'utf8')).find((t) => t.id === 'h-arxiv-1602.03837');
const ai = JSON.parse(fs.readFileSync(path.join(here, 'corpus', 'ai-opus.json'), 'utf8'))[0];
if (!human || !ai) { console.error('corpus texts not found next to this script'); process.exit(1); }

console.log(`AI Detector check on ${origin} — ${new Date().toISOString()} (UTC)`);
const b = await chromium.launch();
let fails = 0;
let limited = 0;
for (const [label, t, want] of [['LIGO 2016 abstract (human)', human, 'human'], [`${ai.id} (AI)`, ai, 'ai']]) {
  const p = await b.newPage();
  try {
    await p.goto(origin + '/tools/ai-tools/ai-detector', { waitUntil: 'networkidle', timeout: 60000 });
    await p.getByPlaceholder('Paste text to analyze...').fill(t.text);
    const declared = await p.locator('text=words per analysis').first().textContent();
    await p.getByRole('button', { name: 'Detect AI Content' }).click();
    await p.locator('[data-verdict], p.text-red-400').first().waitFor({ timeout: 60000 });
    const verdict = await p.locator('[data-verdict]').getAttribute('data-verdict').catch(() => null);
    const shares = verdict ? await p.locator('[data-shares]').innerText() : await p.locator('p.text-red-400').first().innerText();
    if (!verdict && /free words/i.test(shares)) {
      limited++;
      console.log('NOT RUN', label, '-> daily limit of this connection:', shares.replace(/\s+/g, ' '));
    } else {
      const ok = verdict === want;
      if (!ok) fails++;
      console.log(ok ? 'PASS' : 'FAIL', label, '-> expected', want, 'got', verdict, '|', shares.replace(/\s+/g, ' '), '|', declared.replace(/\s+/g, ' '));
    }
  } catch (e) {
    fails++;
    console.log('FAIL', label, '-> page error:', String(e.message).split('\n')[0]);
  }
  await p.close();
}
await b.close();
if (fails) { console.log(`RESULT: ${fails} failure(s) — report it to Claude with the lines above.`); process.exit(1); }
if (limited) { console.log('RESULT: not run (daily limit already used today by this connection). Retry after 00:00 UTC.'); process.exit(2); }
console.log('RESULT: both verdicts right (LIGO = human, AI text = AI).');
