// Real pages, same inputs as given to convertcase.net and wordcounter.net (RAPPORT-licence-et-ameliorations.md §5).
// Usage: node scripts/browser-tests/text-tools.mjs <origin or _vercel_share URL> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
const entry = process.argv[2];
const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const page = await b.newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
let fails = 0;
const check = (name, got, want) => { const ok = got === want; if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`); };

await page.goto(origin + '/tools/text-tools/case-converter', { waitUntil: 'networkidle' });
const ta = page.locator('textarea').first();
await ta.fill('HELLO WORLD. THIS IS A TEST! is it working? yes. i think so. MR. SMITH went to NASA in the USA.');
await page.getByRole('button', { name: 'Sentence case' }).click();
check('sentence case', await ta.inputValue(), 'Hello world. This is a test! Is it working? Yes. I think so. Mr. smith went to NASA in the USA.');
await ta.fill("the lord of the rings and a tale of two cities: an end to it. o'neil's mcdonald well-known e-mail iPhone");
await page.getByRole('button', { name: 'Title Case' }).click();
check('title case', await ta.inputValue(), "The Lord of the Rings and a Tale of Two Cities: An End to It. O'Neil's Mcdonald Well-Known E-Mail iPhone");

await page.goto(origin + '/tools/text-tools/word-counter', { waitUntil: 'networkidle' });
await page.locator('textarea').first().fill('Hello world. Mr. Smith paid $3.50 for it! Wait... what? 👍🏽👨‍👩‍👧 家族は大切です。今日は晴れ。 End');
const stat = async (label) => (await page.locator(`div:text-is("${label}")`).locator('xpath=preceding-sibling::div').innerText()).trim();
check('words', await stat('Words'), '18');
check('characters', await stat('Characters'), '77');
check('sentences', await stat('Sentences'), '6');

await page.goto(origin + '/tools/text-tools/text-reverser', { waitUntil: 'networkidle' });
await page.locator('textarea').first().fill('ab👍🏽🇫🇷é\nsecond line');
await page.getByRole('button', { name: 'Reverse Text' }).click();
check('reverse text', await page.locator('textarea').nth(1).inputValue(), 'enil dnoces\né🇫🇷👍🏽ba');
await page.getByRole('button', { name: 'Reverse Words' }).click();
check('reverse words', await page.locator('textarea').nth(1).inputValue(), 'ab👍🏽🇫🇷é\nline second');
await b.close();
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
process.exit(fails ? 1 : 0);
