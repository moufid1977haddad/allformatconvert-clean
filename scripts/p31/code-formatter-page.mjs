// P31 (03/10): the real Code Formatter page, in Chromium and WebKit: every language through Auto-detect (detection +
// formatter loaded on demand), SQL dialects chosen in the list, accents/emoji, syntax errors shown with their line
// (XML's included, which needs the browser's DOMParser), the iPhone case (JavaScript with JSON chosen), the download
// name, and the 44 px targets.
//   node scripts/p31/code-formatter-page.mjs http://localhost:3311 [--browser=chromium|webkit]   (default: both)
import { chromium, webkit } from '@playwright/test';
import { SAMPLES, SQL_DIALECT_SAMPLES, ACCENTS, ERRORS } from './code-formatter-samples.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3311').origin;
const only = (process.argv.find((a) => a.startsWith('--browser=')) || '').slice(10);
const engines = { chromium, webkit };
const LABEL = { javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'JSX (React)', json: 'JSON', html: 'HTML', xml: 'XML', css: 'CSS', scss: 'SCSS', less: 'LESS', sql: 'SQL', yaml: 'YAML', markdown: 'Markdown', graphql: 'GraphQL' };
const EXT = { javascript: 'js', typescript: 'ts', jsx: 'jsx', json: 'json', html: 'html', xml: 'xml', css: 'css', scss: 'scss', less: 'less', sql: 'sql', yaml: 'yaml', markdown: 'md', graphql: 'graphql' };
let total = { pass: 0, fail: 0 };

for (const name of only ? [only] : ['chromium', 'webkit']) {
  const b = await engines[name].launch();
  const ctx = await b.newContext();
  await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
  const page = await ctx.newPage();
  let pass = 0, fail = 0;
  const check = (n, ok, info = '') => { if (ok) pass++; else fail++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };

  const run = async ({ input, lang = 'auto', dialect }) => {
    await page.goto(origin + '/tools/developer-tools/code-formatter', { waitUntil: 'load' });
    const box = page.getByPlaceholder('Paste code here...');
    await box.waitFor();
    // hydrated: React has attached its handlers to the box (a fill before that would not enable Format)
    await page.waitForFunction(() => { const el = document.querySelector('textarea[aria-label="Input"]'); return el && Object.keys(el).some((k) => k.startsWith('__reactProps')); });
    await box.fill(input);
    await page.locator('#cf-lang').selectOption(lang);
    if (dialect) await page.locator('#cf-dialect').selectOption(dialect);
    await page.getByRole('button', { name: 'Format', exact: true }).click();
    await page.waitForFunction(() => { const v = document.querySelector('textarea[aria-label="Output"]').value; const s = document.querySelector('[data-testid="cf-status"]').textContent; return v && !/Formatting/.test(s); }, null, { timeout: 30000 });
    return { out: await page.locator('textarea[aria-label="Output"]').inputValue(), status: await page.getByTestId('cf-status').textContent(), box: await box.inputValue() };
  };

  for (const s of SAMPLES) {
    const { out, status } = await run({ input: s.input });
    const missing = s.expect.filter((x) => !out.includes(x));
    check(`auto ${s.lang}: "${status}"`, !missing.length && status === `Formatted as ${LABEL[s.lang]}${s.lang === 'sql' ? ' (Standard SQL)' : ''} (detected)`, `status ${status}; missing ${JSON.stringify(missing)}\n${out}`);
    const dl = await page.getByText('formatted.' + EXT[s.lang], { exact: false }).first().waitFor({ timeout: 5000 }).then(() => true, () => false);
    check(`  download offered as formatted.${EXT[s.lang]}`, dl);
  }
  for (const s of SQL_DIALECT_SAMPLES) {
    const { out } = await run({ input: s.input, lang: 'sql', dialect: s.dialect });
    const missing = (s.expect || [s.error]).filter((x) => !out.includes(x));
    check(`sql dialect ${s.dialect}`, !missing.length, `missing ${JSON.stringify(missing)}\n${out}`);
  }
  {
    const { out, box } = await run({ input: ACCENTS.input });
    const missing = ACCENTS.expect.filter((x) => !out.includes(x));
    check('accents and emoji intact (Élodie, Montréal, 🎉, 👋🏽)', !missing.length && box === ACCENTS.input, `missing ${JSON.stringify(missing)}\n${out}`);
  }
  for (const s of [...ERRORS, { lang: 'xml', input: '<a>\n  <b>hi</c>\n</a>', line: 2 }]) {
    const { out } = await run({ input: s.input, lang: s.lang });
    const head = `Error: Line ${s.line}` + (s.column ? `, column ${s.column}:` : ', column ');
    check(`error ${s.lang}: "${out.split('\n')[0]}"`, out.startsWith(head) && out.includes('\n> '), out);
    check(`  no download offered for an error`, (await page.getByText('formatted.', { exact: false }).count()) === 0);
  }
  {
    // The iPhone report: JavaScript with JSON chosen.
    const { out } = await run({ input: 'const nom = "Élodie";\nconst ville = "Montréal";', lang: 'json' });
    check(`JavaScript with JSON chosen: "${out.split('\n')[0].slice(0, 110)}…"`, /^Error: Line 1, column 1: .*looks like JavaScript, not JSON/.test(out) && !/JSON Parse error|Unexpected identifier|JSON\.parse/.test(out), out);
    const auto = await run({ input: 'const nom = "Élodie";\nconst ville = "Montréal";' });
    check('same text with Auto-detect: formatted as JavaScript', auto.status === 'Formatted as JavaScript (detected)' && auto.out.includes('const nom = "Élodie";'), auto.status + '\n' + auto.out);
  }
  {
    // Targets: the two lists and the two buttons at least 44 px high.
    await run({ input: 'select 1 from t', lang: 'sql' });
    for (const sel of ['#cf-lang', '#cf-dialect']) { const h = (await page.locator(sel).boundingBox()).height; check(`${sel} height ${h.toFixed(0)} px >= 44`, h >= 44); }
    for (const n of ['Format', 'Copy']) { const h = (await page.getByRole('button', { name: n, exact: true }).boundingBox()).height; check(`button ${n} height ${h.toFixed(0)} px >= 44`, h >= 44); }
  }
  console.log(`${name}: ${pass} passed, ${fail} failed\n`);
  total.pass += pass; total.fail += fail;
  await b.close();
}
console.log(`TOTAL ${total.pass} passed, ${total.fail} failed`);
process.exit(total.fail ? 1 : 0);
