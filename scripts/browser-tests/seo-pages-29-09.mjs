// The 10 pages improved for search on 29/09 (croissance-29-09, point 4). For each page, in the chosen engine:
//  1. raw HTML (no JavaScript): <title>, meta description, canonical, and ONE JSON-LD script that parses and has what
//     Google documents as required — WebApplication (name, url, offers), BreadcrumbList (position, name, item on each
//     of 3 items), FAQPage (every Question has a name and an acceptedAnswer.text);
//  2. every FAQ question of the JSON-LD is visible on the rendered page (Google: markup must match visible content);
//  3. the "Example" block tells the truth: its input is run through the REAL tool and the tool's output must equal the
//     example's output (tabs shown as → in the example);
//  4. every "Related tools" link answers 200;
//  5. no page error in the console.
// Usage: node scripts/browser-tests/seo-pages-29-09.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };
const TAB = '→';

// How to run each tool on the example's input and read its output.
const convertBox = async (p, input) => {
  await p.locator('textarea:not([readonly])').first().fill(input);
  await p.getByRole('button', { name: /^Convert$/ }).first().click();
  const out = p.locator('textarea[readonly]').first();
  await p.waitForFunction((el) => el.value.length > 0, await out.elementHandle(), { timeout: 30000 });
  return out.inputValue();
};
const PAGES = [
  { path: '/tools/math-tools/percentage-calculator', run: async (p) => {
    const inputs = p.locator('input[type=number]');
    const res = p.locator('.text-xl.font-bold');
    const pairs = [['15', '80'], ['12', '80'], ['60', '72']];
    const out = [];
    for (let i = 0; i < 3; i++) { await inputs.nth(2 * i).fill(pairs[i][0]); await inputs.nth(2 * i + 1).fill(pairs[i][1]); out.push((await res.nth(i).innerText()).trim()); }
    await inputs.nth(4).fill('72'); await inputs.nth(5).fill('60'); out.push((await res.nth(2).innerText()).trim());
    return out.join('\n');
  } },
  { path: '/tools/developer-tools/hash-generator', run: async (p, ex) => {
    await p.locator('textarea').first().fill(ex.input);
    await p.waitForTimeout(1500);
    const body = await p.locator('body').innerText();
    // every "ALGO  value" line of the example must be on the page (the tool shows MD5, SHA-1, SHA-256, CRC32 by default)
    return ex.output.split('\n').filter((l) => body.includes(l.trim().split(/\s+/).pop())).join('\n');
  } },
  { path: '/tools/qr-barcodes-tools/barcode-generator' },
  { path: '/tools/developer-tools/csv-to-sql', run: (p, ex) => convertBox(p, ex.input) },
  { path: '/tools/developer-tools/csv-to-json', run: (p, ex) => convertBox(p, ex.input) },
  { path: '/tools/developer-tools/csv-to-tsv', run: async (p, ex) => (await convertBox(p, ex.input.replaceAll(TAB, '\t'))).replaceAll('\t', TAB) },
  { path: '/tools/developer-tools/tsv-to-csv', run: (p, ex) => convertBox(p, ex.input.replaceAll(TAB, '\t')) },
  { path: '/tools/developer-tools/toml-to-json', run: (p, ex) => convertBox(p, ex.input) },
  { path: '/tools/developer-tools/json-to-toml', run: (p, ex) => convertBox(p, ex.input) },
  { path: '/tools/developer-tools/sql-to-csv', run: (p, ex) => convertBox(p, ex.input) },
];

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
for (const pg of PAGES) {
  const url = origin + pg.path;
  // 1. raw HTML
  const html = await (await fetch(url)).text();
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  check(`${pg.path}: title (${title.length} chars), description (${desc.length}), canonical`, title.length >= 20 && title.length <= 65 && desc.length >= 70 && canon === 'https://www.onlineconvertools.com' + pg.path, `${title} | ${desc.length} | ${canon}`);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let ld = null; try { ld = JSON.parse(scripts[0]); } catch {}
  const g = ld?.['@graph'] || [];
  const app = g.find((x) => x['@type'] === 'WebApplication');
  const bc = g.find((x) => x['@type'] === 'BreadcrumbList');
  const faq = g.find((x) => x['@type'] === 'FAQPage');
  const bcOk = bc?.itemListElement?.length === 3 && bc.itemListElement.every((it, i) => it.position === i + 1 && it.name && /^https:\/\/www\.onlineconvertools\.com\//.test(it.item));
  const faqOk = faq?.mainEntity?.length > 0 && faq.mainEntity.every((q) => q['@type'] === 'Question' && q.name && q.acceptedAnswer?.['@type'] === 'Answer' && q.acceptedAnswer.text);
  check(`${pg.path}: one JSON-LD script, valid WebApplication + BreadcrumbList + FAQPage (${faq?.mainEntity?.length} questions)`, scripts.length === 1 && ld?.['@context'] === 'https://schema.org' && app?.name && app.url === 'https://www.onlineconvertools.com' + pg.path && app.offers?.price === '0' && bcOk && faqOk, JSON.stringify(ld).slice(0, 300));
  // 2-5. rendered page
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle' });
  const body = await p.locator('body').innerText();
  const missing = (faq?.mainEntity || []).filter((q) => !body.includes(q.name));
  check(`${pg.path}: every FAQ question of the markup is visible on the page`, missing.length === 0, missing.map((q) => q.name).join(' | '));
  const exIn = p.locator('pre[data-example=input]');
  if (pg.run) {
    const ex = { input: await exIn.innerText(), output: await p.locator('pre[data-example=output]').innerText() };
    const got = (await pg.run(p, ex)).replace(/\r/g, '').trimEnd();
    check(`${pg.path}: the example's output is what the tool really gives`, got === ex.output.trimEnd(), `\n--- example:\n${ex.output}\n--- tool:\n${got}`);
  } else check(`${pg.path}: no example block (nothing to verify)`, (await exIn.count()) === 0);
  const hrefs = await p.locator('h2:text("Related tools") + ul a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  const bad = [];
  for (const h of hrefs) { const r = await fetch(origin + h, { redirect: 'manual' }); if (r.status !== 200) bad.push(`${h} ${r.status}`); }
  check(`${pg.path}: ${hrefs.length} related links, all 200`, hrefs.length >= 2 && bad.length === 0, bad.join(', '));
  check(`${pg.path}: no page error`, errors.length === 0, errors.join(' | '));
  await p.close();
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${name}, ${PAGES.length} pages)`);
process.exit(fails ? 1 : 0);
