// P37 lot 1 (dev-code) -- what only a browser proves for TypeScript to JS and API Tester:
// the page loads Sucrase's CommonJS entry points (sucrase/dist/index.js, sucrase/dist/parser) in the
// Turbopack bundle, and the API Tester sends nothing for a relative address and one Content-Type.
//   node scripts/p37/dev-code-browser.mjs <origin>        e.g. http://localhost:3000 (a local `next start`)
// No request leaves for a real API: https://api.p37.test/ is answered by page.route() here.
import { chromium } from '@playwright/test';

const originArg = process.argv[2];
if (!originArg) { console.error('usage: node scripts/p37/dev-code-browser.mjs <origin>'); process.exit(2); }
const origin = new URL(originArg).origin;
let fail = 0;
const ok = (cond, label, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${label}${detail ? ' -- ' + detail : ''}`); if (!cond) fail++; };

const browser = await chromium.launch();
const page = await browser.newPage();

// 1. TypeScript to JS
await page.goto(`${origin}/tools/developer-tools/typescript-to-js`, { waitUntil: 'networkidle' });
const tsIn = page.getByPlaceholder('Paste TypeScript here...');
const tsOut = page.getByLabel('JavaScript Output');
const convert = async (code) => {
  await tsIn.fill(code);
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="JavaScript Output"]')?.value !== '', null, { timeout: 15000 });
  const v = await tsOut.inputValue();
  await tsIn.fill(''); // clears nothing in the output; the next fill + click replaces it
  return v;
};
let out = await convert('const C = (p: { n: string }) => <div>{p.n}</div>;');
ok(out.includes('<div>{p.n}</div>') && !out.startsWith('Error'), 'TS: JSX after => converts', JSON.stringify(out));
await page.reload({ waitUntil: 'networkidle' });
out = await convert('namespace A { export const x = 1; }\nconsole.log(A.x);');
ok(/^Error: namespace "A" \(line 1\)/.test(out), 'TS: namespace with values refused by name', JSON.stringify(out.slice(0, 80)));
await page.reload({ waitUntil: 'networkidle' });
out = await convert('const n: number = <number>(<any>"5") * 2;');
ok(out.trim() === 'const n = ("5") * 2;','TS: old-style cast still read as a cast', JSON.stringify(out));

// 2. API Tester
await page.goto(`${origin}/tools/developer-tools/api-tester`, { waitUntil: 'networkidle' });
const sent = [];
page.on('request', (r) => { if (r.resourceType() === 'fetch' || r.resourceType() === 'xhr') sent.push(r); });
await page.route('https://api.p37.test/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: '{"ok":true}' }));
const urlBox = page.getByPlaceholder('https://api.example.com/endpoint');
await urlBox.fill('/api/users');
await page.getByRole('button', { name: 'Send Request' }).click();
await page.getByText('starting with https:// or http://').first().waitFor({ timeout: 5000 });
ok(sent.filter((r) => r.url().startsWith(origin + '/api/users')).length === 0, 'API: relative address refused, nothing sent to our site', `${sent.length} fetch request(s)`);

await page.getByLabel('HTTP method').selectOption('POST');
await urlBox.fill('https://api.p37.test/items');
await page.getByPlaceholder('{"Authorization": "Bearer token"}').fill('{"content-type": "text/plain"}');
await page.getByPlaceholder('{"key": "value"}').fill('hello');
const reqP = page.waitForRequest((r) => r.url() === 'https://api.p37.test/items' && r.method() === 'POST', { timeout: 10000 });
await page.getByRole('button', { name: 'Send Request' }).click();
const req = await reqP;
const ct = await req.headerValue('content-type');
ok(ct === 'text/plain', 'API: lowercase content-type replaces the default (one value)', `sent: ${ct}`);

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nALL PASS');
process.exit(fail ? 1 : 0);
