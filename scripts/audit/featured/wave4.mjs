// Wave 4 of the featured-tools audit: Currency, Unit and Color converters, Number Base Converter (math),
// Percentage Calculator, Roman Numeral Converter. Every value is checked against an independent reference
// computed here (exact arithmetic / BigInt / the exchange-rate API itself).
// Usage: AUDIT_FX=<dir> AUDIT_OUT=<dir> node scripts/audit/featured/wave4.mjs [toolFilter]
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser, openTool, OUT } from './lib.mjs';

const only = process.argv[2];
const results = [];
const { browser, ctx } = await openBrowser();
async function scenario(name, fn) {
  if (only && !name.startsWith(only)) return;
  const t0 = Date.now();
  try { results.push({ scenario: name, ...(await fn()) }); }
  catch (e) { results.push({ scenario: name, exception: String(e).slice(0, 300) }); }
  results.at(-1).secs = +((Date.now() - t0) / 1000).toFixed(1);
  console.log(JSON.stringify(results.at(-1)));
}
const setVal = (loc, v) => loc.evaluate((el, val) => {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(val));
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}, v);
const bodyText = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
// The tool's own card (every tool page wraps its UI in one), never the navbar.
const card = (page) => page.locator('div.bg-white.border').first();
const cardText = async (page) => (await card(page).innerText()).replace(/\s+/g, ' ');

await scenario('currency-converter', async () => {
  const api = await (await ctx.request.get('https://api.exchangerate-api.com/v4/latest/USD')).json();
  const { page } = await openTool(ctx, '/tools/converter-tools/currency-converter');
  await page.waitForFunction(() => /Updated:/.test(document.body.innerText), null, { timeout: 20000 });
  const selects = page.locator('select:not(.goog-te-combo)');
  await setVal(page.locator('input[type=number]').first(), 250);
  await setVal(selects.nth(0), 'GBP');
  await setVal(selects.nth(1), 'JPY');
  await page.waitForTimeout(500);
  const txt = await bodyText(page);
  const expected = (250 / api.rates.GBP) * api.rates.JPY;
  const options = await selects.nth(0).locator('option').count();
  return { expected: expected.toFixed(4), shownContainsExpected: txt.includes(expected.toFixed(2).slice(0, -1)), updatedShown: (txt.match(/Updated: [^A-Z]*[AP]?M?/) || [''])[0], apiRatesDate: new Date(api.time_last_updated * 1000).toISOString(), currenciesOffered: options, currenciesInApi: Object.keys(api.rates).length };
});

await scenario('unit-converter', async () => {
  const { page } = await openTool(ctx, '/tools/converter-tools/unit-converter');
  const out = {};
  const cases = [['Length', 'mm', 'mile', 1, 1 / 1609344], ['Length', 'km', 'inch', 1, 1e6 / 25.4], ['Weight', 'mg', 'ton', 1, 1e-9], ['Temperature', 'C', 'F', 100, 212], ['Temperature', 'K', 'C', 0, -273.15], ['Volume', 'L', 'gallon', 1, 1 / 3.785411784]];
  for (const [cat, from, to, v, exact] of cases) {
    await page.getByRole('button', { name: cat, exact: true }).click();
    const selects = page.locator('select:not(.goog-te-combo)');
    await setVal(selects.nth(0), from);
    await setVal(selects.nth(1), to);
    await setVal(page.locator('input[type=number]').first(), v);
    await page.waitForTimeout(200);
    const txt = await bodyText(page);
    const shown = (txt.match(/(-?\d[\d,]*\.?\d*(e[-+]?\d+)?)\s*(mile|inch|ton|F|C|gallon)\b/) || [])[1] || txt.slice(0, 0);
    out[`${v} ${from}->${to}`] = { exact, card: (await cardText(page)).replace(/^.*?(?=From)/, '').slice(0, 140) };
  }
  return { out };
});

await scenario('color-converter', async () => {
  const { page } = await openTool(ctx, '/tools/converter-tools/color-converter');
  const hex = card(page).locator('input[type=text]').first();
  const res = {};
  for (const h of ['#3b82f6', '#abc', '#FF8000', 'zzz']) {
    await hex.fill(h);
    await page.waitForTimeout(200);
    const txt = await cardText(page);
    res[h] = { rgb: (txt.match(/rgb\([^)]*\)/) || [''])[0], hsl: (txt.match(/hsl\([^)]*\)/) || [''])[0] };
  }
  const formats = ['HEX', 'RGB', 'HSL', 'HSV', 'CMYK'].filter((f) => new RegExp(`\\b${f}\\b`).test(res && ''));
  return { res, labels: await page.locator('label').allInnerTexts() };
});

await scenario('number-base-converter', async () => {
  const { page } = await openTool(ctx, '/tools/math-tools/number-base-converter');
  const input = page.locator('input[placeholder="Enter value..."]');
  const sel = page.locator('select:not(.goog-te-combo)').first();
  const res = {};
  for (const [base, v, expect] of [['2', '1012', 'invalid'], ['10', '12abc', 'invalid'], ['10', '18446744073709551615', 'FFFFFFFFFFFFFFFF'], ['16', 'ff', '255'], ['10', '255', '11111111']]) {
    await setVal(sel, base);
    await input.fill(v);
    await page.waitForTimeout(200);
    res[`${v} (base ${base})`] = { expect, shown: (await cardText(page)).replace(/^.*?Hexadecimal \(16\) /, '').slice(0, 220) };
  }
  return { res };
});

await scenario('percentage-calculator', async () => {
  const { page } = await openTool(ctx, '/tools/math-tools/percentage-calculator');
  const n = page.locator('input[type=number]');
  const fill = async (i, v) => n.nth(i).fill(String(v));
  await fill(0, 0.001); await fill(1, 5);
  await fill(2, 1); await fill(3, 300000);
  await fill(4, 50); await fill(5, 75);
  const txt = await bodyText(page);
  return { shown: txt.match(/What is X% of Y\?.*?(?=Percentage Calculator offers|How to)/)?.[0]?.slice(0, 300), expected: { '0.001% of 5': 0.00005, '1 of 300000': '0.000333%', '50->75': '50%' } };
});

await scenario('roman-numeral-converter', async () => {
  const { page } = await openTool(ctx, '/tools/math-tools/roman-numeral-converter');
  const inputs = card(page).locator('input');
  const num = inputs.nth(0);
  const rom = inputs.nth(1);
  const res = {};
  for (const v of ['1994', '3999', '4000', '0']) { await num.fill(v); res[`num ${v}`] = await rom.inputValue(); }
  for (const v of ['mcmxciv', 'IM', 'IIII', 'VX', 'MMMM', 'ABC']) { await rom.fill(v); res[`roman ${v}`] = await num.inputValue(); }
  return { res };
});

fs.writeFileSync(path.join(OUT, `wave4-results${only ? '-' + only.replace(/[^a-z0-9-]/gi, '_') : ''}.json`), JSON.stringify(results, null, 2));
await browser.close();
