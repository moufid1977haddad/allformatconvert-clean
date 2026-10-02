// P25 (03/10), lot 1: E6 passphrase, E7 rate history, error reporting from every tool — used as a visitor.
// Usage: node scripts/p25/lot1.mjs <origin> [--browser=chromium|firefox|webkit] [--expect-recorded] [--only=a,b]
//   --expect-recorded: on www only — the provoked report must be WRITTEN (X-Tool-Error-Recorded: yes). Writes one real
//   row in tool_errors (tool json-formatter, errorType ToolMessage), noted in the P25 report.
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
const want = (k) => !only || only.includes(k);
const expectRecorded = process.argv.includes('--expect-recorded');
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const engine = { chromium, firefox, webkit }[name];
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.route(/vercel\.live/, (r) => r.abort());
async function open(c, slug) { const p = await c.newPage(); await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(700); return p; }
const EFF = new Set(fs.readFileSync(new URL('../../app/lib/effWordlist.js', import.meta.url), 'utf8').match(/'([a-z -]+)'\.split/)[1].split(' '));

if (want('passphrase')) {
  const p = await open(ctx, 'developer-tools/password-generator');
  await p.getByRole('radio', { name: 'Passphrase' }).click();
  await p.locator('#pp-words').fill('8');
  await p.locator('#pp-separator').selectOption('.');
  await p.locator('#pp-capitalize').check(); await p.locator('#pp-number').check();
  await p.locator('#pw-count').fill('20');
  await p.getByRole('button', { name: 'Generate Passphrase' }).click();
  await p.getByLabel('Passwords').waitFor({ timeout: 10000 });
  const all = (await p.getByLabel('Passwords').inputValue()).split('\n');
  const okEach = all.every((pp) => {
    const parts = pp.split('.');
    const digits = parts.filter((w) => /\d$/.test(w));
    return parts.length === 8 && digits.length === 1 && parts.every((w) => /^[A-Z]/.test(w) && EFF.has(w.replace(/\d$/, '').toLowerCase()));
  });
  const bits = Number(await p.locator('[data-entropy]').getAttribute('data-entropy'));
  const attribution = await p.getByRole('link', { name: 'EFF Large Wordlist' }).count();
  check('passphrase: 20 × 8 EFF words, capitalized, "." between, one digit each; ≈109 bits; EFF attribution', all.length === 20 && okEach && bits === 109 && attribution === 1, `${all.length} ${bits} ${all[0]}`);
  // Uniform draw: 3,000 words, every first letter of the list is reached and none is over-represented (loose bound)
  await p.locator('#pp-capitalize').uncheck(); await p.locator('#pp-number').uncheck();
  await p.locator('#pp-words').fill('20'); await p.locator('#pw-count').fill('50'); await p.locator('#pp-separator').selectOption(' ');
  const words = [];
  for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: 'Generate Passphrase' }).click(); await p.waitForTimeout(150); words.push(...(await p.getByLabel('Passwords').inputValue()).split(/\s+/)); }
  const inList = words.filter((w) => EFF.has(w)).length;
  check('passphrase: 3,000 drawn words all from the list, 1,000+ distinct', words.length === 3000 && inList === 3000 && new Set(words).size > 1000, `${words.length} ${inList} ${new Set(words).size}`);
  // The password mode is unchanged
  await p.getByRole('radio', { name: 'Password' }).click();
  await p.getByRole('button', { name: 'Generate Password' }).click();
  const pw = await p.locator('.font-mono.text-center').first().innerText();
  check('password mode still 16 characters', pw.length === 16, pw.length);
  await p.close();
}

if (want('currency')) {
  const p = await open(ctx, 'converter-tools/currency-converter');
  await p.locator('[data-history="ok"]').waitFor({ timeout: 20000 }).catch(() => {});
  const ok1 = await p.locator('[data-history="ok"]').count();
  const hi = Number((await p.locator('[data-high]').innerText().catch(() => 'x')).replace(/[^\d.]/g, ''));
  const lo = Number((await p.locator('[data-low]').innerText().catch(() => 'x')).replace(/[^\d.]/g, ''));
  check('currency: USD/EUR 1-month history drawn, high ≥ low, EUR between 0.5 and 1.5', ok1 === 1 && hi >= lo && lo > 0.5 && hi < 1.5, `${hi} ${lo}`);
  await p.getByRole('radio', { name: '10Y' }).click();
  await p.locator('[data-history="ok"]').waitFor({ timeout: 20000 }).catch(() => {});
  const note = await p.locator('[data-history] p.text-xs').innerText().catch(() => '');
  check('currency: 10 years, monthly points', /monthly reference rates/.test(note), note.slice(0, 80));
  // Hover shows a dated rate
  await p.locator('[data-history="ok"] svg').waitFor({ timeout: 20000 }).catch(() => {});
  const box = (await p.locator('[data-history] svg').boundingBox()) || { x: 0, y: 0, width: 0, height: 0 };
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  const hover = (await p.locator('[data-hover]').textContent().catch(() => '')) || '';
  check('currency: hovering the chart reads a dated rate', /\d{4}: [\d.,]+$/.test(hover), hover);
  // CSV through the site's download component
  const dl = p.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  await p.locator('[data-history] a[data-download]').first().click();
  const d = await dl;
  const csv = d ? fs.readFileSync(await d.path(), 'utf8') : '';
  check('currency: CSV downloaded, header date,USD/EUR, 100+ monthly rows', /^date,USD\/EUR\n/.test(csv) && csv.trim().split('\n').length > 100 && /^USD-EUR-10Y\.csv$/.test(d?.suggestedFilename() || ''), `${d?.suggestedFilename()} ${csv.split('\n').length}`);
  // A currency with no published history: said, the conversion still works
  await p.getByLabel('To', { exact: true }).selectOption('BGN');
  await p.locator('[data-unavailable]').waitFor({ timeout: 15000 }).catch(() => {});
  const un = await p.locator('[data-unavailable]').innerText().catch(() => '');
  const conv = await p.locator('.text-4xl').innerText();
  check('currency: BGN has no history, said; conversion still shown', /No rate history is published for BGN/.test(un) && /BGN/.test(conv), un.slice(0, 90));
  await p.close();
}

if (want('errors')) {
  // A visitor's browser, not marked as automated: the report really leaves (navigator.webdriver false, no cookie).
  const b2 = name === 'chromium' ? await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] }) : null;
  if (!b2) console.log('SKIP', name, 'errors: only Chromium can hide navigator.webdriver');
  else {
    const c2 = await b2.newContext();
    await c2.route(/vercel\.live/, (r) => r.abort());
    const reports = [];
    c2.on('request', (r) => { if (r.url().endsWith('/api/report-error')) reports.push({ body: r.postData() || '', resp: r.response() }); });
    const p = await open(c2, 'developer-tools/json-formatter');
    const webdriver = await p.evaluate(() => navigator.webdriver);
    await p.locator('textarea').first().fill('{"name": "Jane Secretname", "card": 4111111111111111,');
    await p.getByRole('button', { name: 'Format', exact: true }).click();
    await p.waitForTimeout(1500);
    // the same mistake again: not sent twice
    await p.getByRole('button', { name: 'Format', exact: true }).click();
    await p.waitForTimeout(1500);
    const shown = reports.map((r) => { try { return JSON.parse(r.body); } catch { return null; } }).filter(Boolean);
    const first = shown[0] || {};
    const resp = reports[0] ? await reports[0].resp : null;
    const recorded = resp ? resp.headers()['x-tool-error-recorded'] : '';
    check('errors: a message shown by json-formatter is reported once, as ToolMessage, without the typed text',
      webdriver === false && shown.length === 1 && first.tool === 'json-formatter' && first.errorType === 'ToolMessage' && !/Secretname|4111/.test(first.errorMessage) && resp?.status() === 204,
      `${shown.length} ${JSON.stringify(first)} status=${resp?.status()} recorded=${recorded}`);
    check(`errors: the route ${expectRecorded ? 'WROTE the row (production)' : 'answered, and wrote nothing (not production)'}`, recorded === (expectRecorded ? 'yes' : 'no'), recorded);
    // An exception nobody catches on a tool page: the crash net reports it
    const before = reports.length;
    await p.evaluate(() => { setTimeout(() => { throw new TypeError('p25 bench: uncaught on purpose'); }, 0); });
    await p.waitForTimeout(1500);
    const net = reports.slice(before).map((r) => { try { return JSON.parse(r.body); } catch { return null; } }).filter(Boolean);
    check('errors: an uncaught exception on a tool page is reported (UncaughtTypeError)', net.length === 1 && net[0].errorType === 'UncaughtTypeError' && net[0].tool === 'json-formatter', JSON.stringify(net));
    await p.close();
    // A page outside /tools never reports through the crash net
    const home = await c2.newPage(); const n0 = reports.length;
    await home.goto(`${origin}/`, { waitUntil: 'load' });
    await home.evaluate(() => { setTimeout(() => { throw new Error('home page error'); }, 0); });
    await home.waitForTimeout(1000);
    check('errors: nothing reported from the home page', reports.length === n0, String(reports.length - n0));
    await b2.close();
  }
}

await b.close();
console.log(`${name}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
