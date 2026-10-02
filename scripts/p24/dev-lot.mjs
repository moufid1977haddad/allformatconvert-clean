// P24 (03/10), developer / text / units / files lot: the wrong results fixed and the options added, used as a visitor.
// Usage: node scripts/p24/dev-lot.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
async function open(slug) { const p = await ctx.newPage(); await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(700); return p; }
const main = (p) => p.locator('main').innerText();

{ // TOML to JSON: a 64-bit integer, inf
  const p = await open('developer-tools/toml-to-json');
  await p.locator('textarea').first().fill('a = 9007199254740993\nf = inf\n');
  await p.getByRole('button', { name: 'Convert', exact: true }).click();
  const out = await p.getByLabel('JSON Output').inputValue();
  check('toml-to-json: 9007199254740993 kept digit for digit; inf written as null and said', out.includes('9007199254740993') && /"f": null/.test(out) && /no infinity or NaN/.test(await main(p)), out.replace(/\n/g, ' '));
  await p.close();
}
{ // JSON to TOML: a 20-digit id, a 64-bit one
  const p = await open('developer-tools/json-to-toml');
  await p.locator('textarea').first().fill('{"id":12345678901234567890,"n":9007199254740993,"v":1.5}');
  await p.getByRole('button', { name: 'Convert', exact: true }).click();
  const out = await p.locator('textarea').nth(1).inputValue();
  check('json-to-toml: 9007199254740993 exact; 12345678901234567890 kept as text and said', /n = 9007199254740993\b/.test(out) && /id = "12345678901234567890"/.test(out) && /written as text/.test(await main(p)), out.replace(/\n/g, ' '));
  await p.close();
}
{ // TSV to CSV: CRLF and a quoted multi-line cell
  const p = await open('developer-tools/tsv-to-csv');
  await p.locator('textarea').first().fill('a\tb\r\n"line 1\nline 2"\t5" screen\r\n');
  await p.getByRole('button', { name: 'Convert', exact: true }).click();
  const out = await p.locator('textarea').nth(1).inputValue();
  check('tsv-to-csv: no stray carriage return, multi-line cell kept in one field, inner quote kept', out.replace(/\r\n/g, '\n') === 'a,b\n"line 1\nline 2","5"" screen"', JSON.stringify(out)); // a textarea always reads its line ends as \n
  await p.close();
}
{ // Unit Converter: "1,000" asks, "1 000" is a thousand, "1.000,5" European
  const p = await open('converter-tools/unit-converter');
  const field = p.locator('main input').first();
  await field.fill('1,000');
  const asks = /one thousand or one/.test(await main(p));
  await field.fill('1 000');
  const t1 = await main(p);
  await field.fill('1.234,5');
  const t2 = await main(p);
  check('unit-converter: "1,000" asks; "1 000" = 1000; "1.234,5" = 1234.5', asks && /1000 m =/.test(t1.replace(/,/g, '')) && /1234\.5 m =/.test(t2.replace(/,/g, '')), '');
  await p.close();
}
{ // Roman numerals: 12.7 is refused, 1994 → MCMXCIV
  const p = await open('math-tools/roman-numeral-converter');
  await p.getByLabel('Number (1-3999)').fill('12.7');
  const refused = /whole number/.test(await main(p));
  await p.getByLabel('Number (1-3999)').fill('1994');
  const r = await p.locator('main input').nth(1).inputValue();
  check('roman: 12.7 refused with a sentence; 1994 → MCMXCIV', refused && r === 'MCMXCIV', r);
  await p.close();
}
{ // UUID v7: version nibble 7, variant 8-b, sorted by time; uppercase without hyphens
  const p = await open('developer-tools/uuid-generator');
  await p.locator('#uuid-version').selectOption('7');
  await p.getByLabel('Count').fill('50');
  await p.getByRole('button', { name: 'Generate', exact: true }).click();
  const ids = (await main(p)).match(/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g) || [];
  const ms = parseInt(ids[0]?.replace(/-/g, '').slice(0, 12) || '0', 16);
  check('uuid: 50 v7 UUIDs, RFC 9562 layout, in creation order, timestamp = now', ids.length === 50 && ids.every((x, i) => !i || x > ids[i - 1]) && Math.abs(ms - Date.now()) < 60000, `${ids.length} ${ids[0]}`);
  await p.locator('#uuid-upper').check(); await p.locator('#uuid-hyphens').uncheck();
  await p.getByRole('button', { name: 'Generate', exact: true }).click();
  check('uuid: uppercase, no hyphens', /\b[0-9A-F]{12}7[0-9A-F]{19}\b/.test(await main(p)));
  await p.close();
}
{ // Case converter
  const p = await open('text-tools/case-converter');
  const ta = p.locator('textarea').first();
  await ta.fill('myHTTPServer is ready\nCafé crème');
  await p.getByRole('button', { name: 'snake_case' }).click();
  const snake = await ta.inputValue();
  await ta.fill('hello big world'); await p.getByRole('button', { name: 'camelCase' }).click();
  const camel = await ta.inputValue();
  check('case: snake_case per line (accents kept), camelCase', snake === 'my_http_server_is_ready\ncafé_crème' && camel === 'helloBigWorld', JSON.stringify([snake, camel]));
  await p.close();
}
{ // Percentage change from a negative base
  const p = await open('math-tools/percentage-calculator');
  await p.getByPlaceholder('From X').fill('-10'); await p.getByPlaceholder('To Y').fill('-5');
  const t = await main(p);
  await p.getByPlaceholder('Y %').first().fill('20'); // "X is Y% of what?" uses placeholders X / Y %
  check('percentage: from -10 to -5 is +50 %', /(^|\s)50%/.test(t) && !/-50%/.test(t), '');
  await p.close();
}
{ // File Splitter: 3 equal parts, then joined back to the same bytes
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-split-'));
  const src = path.join(dir, 'data.bin'); const bytes = Buffer.from(Array.from({ length: 10007 }, (_, i) => (i * 31) & 255)); fs.writeFileSync(src, bytes);
  const p = await open('file-tools/file-splitter');
  await p.locator('input[type=file]').first().setInputFiles(src);
  await p.getByLabel('Into equal parts').check();
  await p.locator('#split-parts').fill('3');
  await p.getByRole('button', { name: /Split/ }).first().click();
  await p.locator('[data-file-download]').nth(2).waitFor({ timeout: 20000 });
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const b64 = await p.locator('[data-file-download] [data-download]').nth(i).evaluate(async (a) => { const u = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); let s = ''; for (const x of u) s += String.fromCharCode(x); return btoa(s); });
    const f = path.join(dir, `data.bin.part${i + 1}`); fs.writeFileSync(f, Buffer.from(b64, 'base64')); parts.push(f);
  }
  await p.getByRole('radio', { name: 'Join parts' }).click();
  await p.locator('input[type=file][multiple]').setInputFiles([parts[2], parts[0], parts[1]]); // out of order on purpose
  await p.locator('[data-file-download]').first().waitFor({ timeout: 20000 });
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => { const u = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); let s = ''; for (const x of u) s += String.fromCharCode(x); return btoa(s); });
  check('file-splitter: 3 equal parts, joined back (chosen out of order) to the identical file', Buffer.from(b64, 'base64').equals(bytes) && parts.every((f) => Math.abs(fs.statSync(f).size - 10007 / 3) <= 1));
  await p.locator('input[type=file][multiple]').setInputFiles([parts[0], parts[2]]);
  check('file-splitter: a missing part is said', /Part 2 is missing/.test(await main(p)));
  await p.close();
}
{ // Regex Tester: groups, replace, catastrophic backtracking stopped
  const p = await open('developer-tools/regex-tester');
  await p.getByLabel('Pattern', { exact: true }).fill('(?<year>\\d{4})-(\\d{2})');
  await p.getByLabel('Test text').fill('Dates: 2026-10 and 1999-12.');
  await p.locator('#rx-replace').check();
  await p.getByLabel('Replacement', { exact: true }).fill('$2/$<year>');
  await p.getByRole('button', { name: 'Test', exact: true }).click();
  await p.locator('[data-match-count]').waitFor({ timeout: 10000 });
  const t = await main(p); const rep = await p.getByLabel('Replacement result').inputValue();
  check('regex: 2 matches with named and numbered groups, replace preview', /2 matches/.test(t) && /year: 2026/.test(t) && /\$2: 12/.test(t) && rep === 'Dates: 10/2026 and 12/1999.', rep);
  await p.getByLabel('Pattern', { exact: true }).fill('(a+)+$');
  await p.getByLabel('Test text').fill('a'.repeat(40) + 'b');
  await p.getByRole('button', { name: 'Test', exact: true }).click();
  const slow = await p.getByText(/takes too long/).waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
  check('regex: catastrophic backtracking stopped after 2 s with a sentence (the page stays responsive)', slow && (await p.evaluate(() => 1 + 1)) === 2);
  await p.close();
}
{ // Text Comparator: changed words marked
  const p = await open('text-tools/text-comparator');
  await p.locator('textarea').nth(0).fill('the quick brown fox\nsame line');
  await p.locator('textarea').nth(1).fill('the slow brown fox\nsame line');
  await p.getByRole('button', { name: /Compare/ }).click();
  await p.locator('main span.bg-red-300').first().waitFor({ timeout: 10000 }).catch(() => {});
  const red = await p.locator('main span.bg-red-300').allInnerTexts(); const green = await p.locator('main span.bg-green-300').allInnerTexts();
  check('text-comparator: "quick" marked removed, "slow" added, nothing else', red.join('|') === 'quick' && green.join('|') === 'slow', red + ' / ' + green);
  await p.close();
}
{ // JSON Formatter: error line / column; sort keys losslessly
  const p = await open('developer-tools/json-formatter');
  await p.locator('textarea').first().fill('{\n  "a": 1,\n  "b": }');
  await p.getByRole('button', { name: 'Format', exact: true }).click();
  await p.getByText(/line 3, column 8/).first().waitFor({ timeout: 10000 }).catch(() => {});
  const err = await main(p);
  await p.locator('textarea').first().fill('{"b":12345678901234567890,"a":1.10}');
  await p.locator('#jf-sort').check(); await p.locator('#jf-indent').selectOption('tab');
  await p.getByRole('button', { name: 'Format', exact: true }).click();
  await p.waitForFunction(() => document.querySelector('textarea[aria-label=Output]')?.value, null, { timeout: 10000 }).catch(() => {});
  const out = await p.getByLabel('Output').inputValue();
  check('json-formatter: error at line 3, column 8; keys sorted, tab indent, numbers untouched', /line 3, column 8/.test(err) && out === '{\n\t"a": 1.10,\n\t"b": 12345678901234567890\n}', JSON.stringify(out));
  await p.close();
}
{ // Password Generator: no look-alikes, 20 at once, strength shown
  const p = await open('developer-tools/password-generator');
  await p.locator('#pw-ambiguous').check(); await p.locator('#pw-count').fill('20');
  await p.getByRole('button', { name: 'Generate Password' }).click();
  const all = (await p.getByLabel('Passwords').inputValue()).split('\n');
  const bits = Number(await p.locator('[data-entropy]').getAttribute('data-entropy'));
  check('password: 20 passwords of 16, none with 0 O 1 l I |, ~100 bits shown', all.length === 20 && all.every((x) => x.length === 16 && !/[0O1lI|]/.test(x)) && bits >= 90 && bits <= 105, `${all.length} ${bits}`);
  await p.close();
}
{ // Unit Converter: new units
  const p = await open('converter-tools/unit-converter');
  await p.getByRole('button', { name: 'Weight', exact: true }).click();
  await p.locator('#uc-from').selectOption('stone'); await p.locator('#uc-to').selectOption('kg');
  await p.locator('main input').first().fill('1');
  const t = await main(p);
  check('unit-converter: 1 stone = 6.35029318 kg', /6\.35029318 kg/.test(t), '');
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
