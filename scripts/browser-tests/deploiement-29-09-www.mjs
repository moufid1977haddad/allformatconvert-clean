// Deployment of qualite-29-09 (P13, 29/09): a sample of the corrections, checked on www as a visitor (Chromium).
//  pdf-merge      -- an AES-256 PDF that opens without a password (+ a plain PDF): the merged PDF is read back by
//                    Poppler's pdftotext and contains the text of every page (it used to come out broken);
//  js-minifier    -- code without semicolons, "return\n42", "a - -b": the minified code behaves like the source;
//  file-encryptor -- AES: header "OCF1", a wrong password is refused; a file made by the OLD XOR version is still
//                    decrypted (with the legacy notice) to the exact original bytes;
//  excel-to-json  -- fixtures/edge-cases.xlsx (openpyxl): emoji intact, dates as ISO text, empty cells null.
// Usage: node scripts/browser-tests/deploiement-29-09-www.mjs [origin=https://www.onlineconvertools.com]
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.argv[2] || 'https://www.onlineconvertools.com';
const FX = 'scripts/converter-tests/fixtures/';
const b = await chromium.launch();
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const fetchBytes = (p, href) => p.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href);

{ // pdf-merge
  const p = await b.newPage();
  await p.goto(origin + '/tools/pdf-tools/pdf-merge', { waitUntil: 'networkidle' });
  await p.locator('input[type="file"]').setInputFiles([FX + 'encrypted-aes-256.pdf', FX + 'plain.pdf']);
  await p.getByRole('button', { name: /Merge PDFs/ }).click();
  const href = await p.locator('a[download="merged.pdf"]').getAttribute('href', { timeout: 60000 });
  const f = join(mkdtempSync(join(tmpdir(), 'merge-')), 'm.pdf');
  writeFileSync(f, Buffer.from(await fetchBytes(p, href)));
  let txt = ''; try { txt = execFileSync('pdftotext', [f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* unreadable */ }
  const n = (txt.match(/Hello encrypted world page/g) || []).length;
  check('pdf-merge: encrypted PDF without password merged, readable', n === 4, `${n}/4 pages read back by pdftotext`);
  await p.close();
}
{ // js-minifier
  const p = await b.newPage();
  await p.goto(origin + '/tools/developer-tools/js-minifier', { waitUntil: 'networkidle' });
  const src = 'let a = 1\nlet b = 2\nfunction f() {\n  return\n  42\n}\nconsole.log(a - -b, f())';
  await p.locator('textarea').first().fill(src);
  await p.getByRole('button', { name: 'Minify', exact: true }).click();
  let out = '';
  for (let i = 0; i < 60 && !out; i++) { out = await p.locator('textarea[readonly]').last().inputValue(); if (!out) await p.waitForTimeout(250); }
  const run = (code) => { const logs = []; new Function('console', code)({ log: (...x) => logs.push(x.join(' ')) }); return logs.join('|'); };
  let got; try { got = run(out); } catch (e) { got = 'ERROR ' + e.message; }
  check('js-minifier: code without semicolons keeps its behaviour', got === run(src), JSON.stringify(out));
  await p.close();
}
{ // file-encryptor
  const p = await b.newPage();
  await p.goto(origin + '/tools/file-tools/file-encryptor', { waitUntil: 'networkidle' });
  const data = Buffer.from('Old secret file éè \u{1F600}\n', 'utf8');
  await p.locator('input[type="file"]').setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: data });
  await p.locator('input[type="password"]').fill('pw');
  await p.getByRole('button', { name: 'Encrypt File' }).click();
  const enc = await fetchBytes(p, await p.locator('a[download]').first().getAttribute('href', { timeout: 30000 }));
  check('file-encryptor: AES output', String.fromCharCode(...enc.slice(0, 4)) === 'OCF1' && enc.length === data.length + 48, `${enc.length} bytes`);
  await p.getByRole('button', { name: 'Decrypt', exact: true }).click();
  await p.locator('input[type="file"]').setInputFiles({ name: 'a.txt.encrypted', mimeType: 'application/octet-stream', buffer: Buffer.from(enc) });
  await p.locator('input[type="password"]').fill('wrong');
  await p.getByRole('button', { name: 'Decrypt File' }).click();
  await p.waitForTimeout(3000);
  check('file-encryptor: wrong password refused', (await p.locator('body').innerText()).includes('Wrong password'));
  // a file made by the old XOR version, password "legacy-key"
  const k = Buffer.from('legacy-key');
  const xor = Buffer.from(data.map((x, i) => x ^ k[i % k.length]));
  await p.locator('input[type="file"]').setInputFiles({ name: 'old.txt.encrypted', mimeType: 'application/octet-stream', buffer: xor });
  await p.locator('input[type="password"]').fill('legacy-key');
  await p.getByRole('button', { name: 'Decrypt File' }).click();
  const dec = await fetchBytes(p, await p.locator('a[download]').first().getAttribute('href', { timeout: 30000 }));
  const body = await p.locator('body').innerText();
  check('file-encryptor: old XOR file read back to the exact original bytes', Buffer.from(dec).equals(data), `${dec.length} bytes`);
  check('file-encryptor: legacy notice shown', body.includes('old XOR method'), body.slice(body.indexOf('XOR') - 80, body.indexOf('XOR') + 60));
  await p.close();
}
{ // excel-to-json
  const p = await b.newPage();
  await p.goto(origin + '/tools/developer-tools/excel-to-json', { waitUntil: 'networkidle' });
  await p.locator('input[type="file"]').setInputFiles(FX + 'edge-cases.xlsx');
  const href = await p.locator('[data-download]').first().getAttribute('href', { timeout: 60000 });
  const json = JSON.parse(Buffer.from(await fetchBytes(p, href)).toString('utf8'));
  const rows = json.Data;
  check('excel-to-json: emoji intact', rows[1].name === 'Zoé \u{1F600}', JSON.stringify(rows[1].name));
  check('excel-to-json: dates as ISO text', rows[0].date === '2024-01-15' && rows[1].date === '2024-02-29T13:45:00', `${rows[0].date} / ${rows[1].date}`);
  check('excel-to-json: empty cells null, zip codes intact', rows[0].note === null && rows[0].zip === '01234', JSON.stringify(rows[0]));
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAILED` : 'all passed', `(${origin})`);
process.exit(fails ? 1 : 0);
