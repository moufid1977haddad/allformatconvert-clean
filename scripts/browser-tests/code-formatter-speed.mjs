// Code Formatter speed (P18 step 5): the Mac's Safari 17.6 bench recorded 151 s on a small JSON while every other
// tool answered in under 60 s. Here, in one engine: the JSON is entered three ways — pasted at once (fill), typed key
// by key (what a WebDriver "send keys" does), typed with a real per-key delay — then "Format" is clicked; each phase
// is timed separately, and the formatted output is checked.
// Usage: node scripts/browser-tests/code-formatter-speed.mjs <origin> [--browser=webkit|chromium|firefox] [--safari16]
import { chromium, firefox, webkit } from '@playwright/test';
import { applySafari16Sim } from './lib/safari16-sim.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const JSON_IN = '{"name":"Ada","id":12345678901234567890,"tags":["a","b"],"nested":{"ok":true,"n":1.10}}';
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--safari16')) await applySafari16Sim(ctx);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

for (const how of ['fill', 'type', 'type-delay']) {
  const p = await ctx.newPage();
  const t0 = Date.now();
  await p.goto(origin + '/tools/developer-tools/code-formatter', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const tLoad = Date.now() - t0;
  const box = p.getByPlaceholder('Paste code here...');
  const t1 = Date.now();
  if (how === 'fill') await box.fill(JSON_IN);
  else await box.pressSequentially(JSON_IN, { delay: how === 'type-delay' ? 20 : 0 });
  const tInput = Date.now() - t1;
  const t2 = Date.now();
  await p.getByRole('button', { name: 'Format', exact: true }).click();
  await p.waitForFunction(() => document.querySelector('textarea[aria-label="Output"]').value.includes('\n'), null, { timeout: 60000 });
  const tFormat = Date.now() - t2;
  const out = await p.locator('textarea[aria-label="Output"]').inputValue();
  check(`${how}: output formatted, 20-digit id and 1.10 kept`, out.includes('"id": 12345678901234567890') && out.includes('"n": 1.10'), out.slice(0, 80));
  console.log(`  ${how}: load ${tLoad} ms, input ${tInput} ms (${JSON_IN.length} chars), format ${tFormat} ms`);
  check(`${how}: format under 2 s`, tFormat < 2000, `${tFormat} ms`);
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAIL (${name})` : `ALL PASS (${name})`);
process.exit(fails ? 1 : 0);
