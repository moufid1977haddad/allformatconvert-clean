// Currency Converter, real page: every currency of the source listed with its name, cross rates right,
// attribution shown; compared with an independent source (ECB via Frankfurter) for EUR->GBP.
// Usage: node scripts/browser-tests/currency-converter.mjs <origin or _vercel_share URL> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
const entry = process.argv[2]; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const page = await b.newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const api = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
await page.goto(origin + '/tools/converter-tools/currency-converter', { waitUntil: 'networkidle' });
await page.getByText('Rates published:').waitFor({ timeout: 30000 });
const sel = page.locator('select').filter({ has: page.locator('option[value="MAD"]') });
const opts = await sel.first().locator('option').allInnerTexts();
check('all currencies listed', opts.length === Object.keys(api.rates).length, `${opts.length} / ${Object.keys(api.rates).length}`);
check('names shown', opts.includes('MAD — Moroccan Dirham') && opts.includes('JPY — Japanese Yen'), opts.slice(0, 3).join(' | '));
await page.locator('input[type=number]').fill('1000');
await sel.nth(0).selectOption('EUR'); await sel.nth(1).selectOption('GBP');
const txt = (await page.locator('text=/^1 EUR = /').innerText());
const shown = parseFloat(txt.match(/1 EUR = ([\d.,]+) GBP/)[1].replace(/,/g, ''));
const expected = api.rates.GBP / api.rates.EUR;
check('cross rate EUR->GBP = rate[GBP]/rate[EUR]', Math.abs(shown / expected - 1) < 1e-5, `${shown} vs ${expected.toFixed(6)}`);
const ecb = await (await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP')).json();
console.log('INFO ECB EUR->GBP', ecb.rates.GBP, `(${ecb.date}), gap ${((shown / ecb.rates.GBP - 1) * 100).toFixed(3)} %`);
await sel.nth(0).selectOption('USD'); await sel.nth(1).selectOption('JPY');
const big = await page.locator('.text-4xl').innerText();
check('JPY without decimals, grouped', /^[\d,.\s  ]+ JPY$/.test(big) && !/[.,]\d{1,2} JPY$/.test(big), big);
check('attribution link', await page.getByRole('link', { name: 'Rates By Exchange Rate API' }).count() === 1);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
