// Improvement 13: Grammar Fixer shows each change in place and lets the visitor undo or restore it. Real page; the
// AI's answer is PLAYED BY THIS TEST (/api/ai intercepted: deterministic, no quota or OpenAI call). Checked: the
// changes shown, the result text for every choice (all kept = the correction, all undone = the original, exactly),
// one change undone and restored, texts with accents, emoji and line breaks, no change, a full rewrite, Copy.
// Usage: node scripts/browser-tests/grammar-fixer-diff.mjs <origin> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

const b = await engine.launch();
const ctx = await b.newContext(engine === chromium ? { permissions: ['clipboard-read', 'clipboard-write'] } : {});
let answer = ''; let calls = 0;
await ctx.route('**/api/ai', (r) => { calls++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: answer }) }); });
const page = await ctx.newPage();
await page.goto(origin + '/tools/ai-tools/grammar-fixer', { waitUntil: 'networkidle' });
async function fix(original, corrected) {
  answer = corrected;
  await page.getByLabel('Text to fix').fill(original);
  await page.getByRole('button', { name: 'Fix Grammar' }).click();
  await page.locator('[data-count]').waitFor();
  return { count: (await page.locator('[data-count]').innerText()).trim(), result: await page.getByLabel('Result').inputValue() };
}
const result = () => page.getByLabel('Result').inputValue();

{
  const o = 'Their is many reason why peoples goes to school. She dont like it and he have went home yesterday.';
  const c = "There are many reasons why people go to school. She doesn't like it, and he went home yesterday.";
  const r = await fix(o, c);
  const shown = await page.locator('[data-change]').evaluateAll((els) => els.map((e) => `${e.querySelector('del')?.textContent ?? ''}>${e.querySelector('ins')?.textContent ?? ''}`));
  check('6 changes shown in place, the result is the correction', r.count.startsWith('6 changes') && r.result === c, `${r.count} · ${shown.join(' | ')}`);
  check('changes are the words that differ: Their is>There are, reason>reasons, peoples goes>people go, dont>doesn\'t, >",", have >', shown.join('|') === "Their is>There are|reason>reasons|peoples goes>people go|dont>doesn't|>,|have >", shown.join('|'));
  await page.locator('[data-change="3"]').click();
  check('undo "dont>doesn\'t" only: the result keeps "dont", everything else corrected', (await result()) === c.replace("doesn't", 'dont') && (await page.locator('[data-count]').innerText()).includes('1 undone'), await result());
  await page.locator('[data-change="3"]').click();
  check('click again: restored', (await result()) === c);
  await page.getByRole('button', { name: 'Undo all' }).click();
  check('Undo all: exactly the original text', (await result()) === o, await result());
  await page.getByRole('button', { name: 'Keep all' }).click();
  check('Keep all: exactly the correction', (await result()) === c);
  if (engine === chromium) {
    await page.locator('[data-change="0"]').click();
    await page.getByRole('button', { name: 'Copy' }).click();
    check('Copy copies the text with the choices made', (await page.evaluate(() => navigator.clipboard.readText())) === c.replace('There are', 'Their is'));
  }
}
{
  const o = 'Café  au lait ,naïve 😀 idea\nsecond line   here.\n\nThird para: l’eau est froid.';
  const c = 'Café au lait, naïve 😀 idea\nSecond line here.\n\nThird para: l’eau est froide.';
  const r = await fix(o, c);
  await page.getByRole('button', { name: 'Undo all' }).click(); const back = await result();
  check('accents, emoji, line breaks, double spaces: all kept = correction, all undone = original', r.result === c && back === o, `${r.count} · ${JSON.stringify(back)}`);
}
{
  const t = 'This sentence is already correct.';
  const r = await fix(t, t);
  check('no change: said so, result = the text', r.count === 'No changes: your text was already correct.' && r.result === t, r.count);
}
{
  const o = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ');
  const c = Array.from({ length: 400 }, (_, i) => `other${i}`).join(' ');
  const t0 = Date.now(); const r = await fix(o, c); const ms = Date.now() - t0;
  await page.getByRole('button', { name: 'Undo all' }).click();
  check('full rewrite of 400 words: shown, round-trips, fast', r.result === c && (await result()) === o && ms < 5000, `${r.count} · ${ms} ms`);
}
check('one AI call per click', calls === 4, `${calls} calls`);
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);
