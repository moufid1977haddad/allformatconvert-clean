// Every tool changed on branch qualite-29-09, used for real in a browser: the
// same edge cases as scripts/converter-tests (which test the logic in Node),
// here through the page -- typing, clicking, reading what the visitor sees.
// Usage: node scripts/browser-tests/qualite-29-09.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const b = await engine.launch();
const ctx = await b.newContext();
let page;
let fails = 0, passes = 0;
const errors = [];
const check = (name, ok, detail = '') => { if (ok) passes++; else { fails++; console.log('FAIL', name, detail); } };
const open = async (path) => {
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`));
  await page.goto(origin + path, { waitUntil: 'networkidle' });
};
// The navbar has its own search box and the page a translation widget: skip them.
const TEXT_IN = 'input[type="text"]:not([placeholder="Search tools..."])';
const SELECT = 'select:not(.goog-te-combo)';
const ta = (i = 0) => page.locator('textarea').nth(i);
const outTa = () => page.locator('textarea[readonly]').last();
const click = (name) => page.getByRole('button', { name, exact: true }).first().click();
const outText = async () => { await outTa().waitFor({ timeout: 20000 }); await page.waitForTimeout(150); return outTa().inputValue(); };
const waitOut = async (pred, ms = 20000) => { const t0 = Date.now(); let v = ''; while (Date.now() - t0 < ms) { v = await outTa().inputValue().catch(() => ''); if (pred(v)) return v; await page.waitForTimeout(150); } return v; };
const body = () => page.locator('body').innerText();
const T = async (name, fn) => { try { await fn(); } catch (e) { fails++; console.log('FAIL', name, String(e.message).slice(0, 200)); } finally { if (page) await page.close().catch(() => {}); page = null; } };

const BIG = '{"id":12345678901234567890,"price":1.10,"name":"Smith, John","first-name":"Zoé 😀","address":{"city":"Paris"},"tags":["a","b"]}';

await T('json-minifier', async () => {
  await open('/tools/developer-tools/json-minifier');
  await ta().fill('﻿{ "id": 12345678901234567890, "p": 1.10 }');
  await click('Minify');
  check('json-minifier exact', (await outText()) === '{"id":12345678901234567890,"p":1.10}', await outTa().inputValue());
});
await T('json-to-yaml', async () => {
  await open('/tools/developer-tools/json-to-yaml');
  await ta().fill(BIG); await click('Convert');
  const v = await outText();
  check('json-to-yaml exact numbers', v.includes('12345678901234567890') && v.includes('1.10') && v.includes('city: Paris'), v);
});
await T('yaml-to-json', async () => {
  await open('/tools/developer-tools/yaml-to-json');
  await ta().fill('d: 2024-01-01\nid: 12345678901234567890\n---\nx: 1\n'); await click('Convert');
  const v = await outText();
  check('yaml-to-json dates/bigint/multidoc', v.includes('"d": "2024-01-01"') && v.includes('12345678901234567890') && v.trim().startsWith('['), v);
});
await T('json-to-csv', async () => {
  await open('/tools/developer-tools/json-to-csv');
  await ta().fill('[{"id":12345678901234567890,"a":{"b":1}},{"id":2,"extra":"x, y"}]'); await click('Convert');
  check('json-to-csv flatten/union', (await outText()) === 'id,a.b,extra\n12345678901234567890,1,\n2,,"x, y"', await outTa().inputValue());
});
for (const [tool, frag] of [['json-to-rust', 'pub first_name: String'], ['json-to-typescript', '"first-name":'], ['json-to-go', 'json:"first-name"'], ['json-to-csharp', 'JsonPropertyName("first-name")'], ['json-to-python', 'class Address']]) {
  await T(tool, async () => {
    await open(`/tools/developer-tools/${tool}`);
    await ta().fill(BIG); await click('Convert');
    const v = await waitOut((x) => x.length > 20, 30000);
    check(`${tool} nested + renamed`, v.includes(frag) && /Address/.test(v), v.slice(0, 300));
  });
}
await T('json-to-php', async () => {
  await open('/tools/developer-tools/json-to-php');
  await ta().fill('{"s":"it\'s","big":12345678901234567890,"n":null}'); await click('Convert');
  const v = await outText();
  check('php array', v.includes("'s' => 'it\\'s',") && v.includes("'big' => '12345678901234567890',") && v.includes("'n' => null,"), v);
  await page.getByLabel(/PHP classes/).check(); await click('Convert');
  const c = await waitOut((x) => x.includes('final class'));
  check('php class', c.includes('final class Root') && c.includes('public string $s,'), c);
});
await T('env-to-json', async () => {
  await open('/tools/developer-tools/env-to-json');
  await ta().fill('export A=1\nB="l1\\nl2" # c\nC=\'lit ${A}\'\nD=${A}x\nnot valid\n');
  await page.getByLabel(/Expand/).check();
  await click('.env to JSON');
  const v = JSON.parse(await outText());
  check('env parse', v.A === '1' && v.B === 'l1\nl2' && v.D === '1x', JSON.stringify(v));
  check('env ignored line reported', (await body()).includes('line 5'), '');
});
await T('base64', async () => {
  await open('/tools/developer-tools/base64-encoder');
  await ta().fill('café 😀'); await click('Encode');
  check('base64 utf8', (await outText()) === 'Y2Fmw6kg8J+YgA==', await outTa().inputValue());
  await ta().fill('Y2Fmw6kg8J-YgA'); await click('Decode');
  check('base64 url-safe decode', (await waitOut((x) => x.startsWith('caf'))) === 'café 😀');
});
await T('hex', async () => {
  await open('/tools/developer-tools/hex-to-text');
  await ta().fill('é😀'); await click('Text to Hex');
  check('hex utf8', (await outText()) === 'c3 a9 f0 9f 98 80', await outTa().inputValue());
});
await T('html-encoder', async () => {
  await open('/tools/developer-tools/html-encoder');
  await ta().fill('&amp;lt; &copy; &#x1F600;'); await click('Decode');
  check('html decode single pass', (await outText()) === '&lt; © 😀', await outTa().inputValue());
});
await T('html-entity-decoder', async () => {
  await open('/tools/developer-tools/html-entity-decoder');
  await ta().fill('<b>x</b> &amp; &euro;'); await click('Decode');
  check('entity decoder keeps tags', (await outText()) === '<b>x</b> & €', await outTa().inputValue());
});
await T('timestamp', async () => {
  await open('/tools/developer-tools/timestamp-converter');
  await page.locator(TEXT_IN).first().fill('1700000000000');
  await page.getByRole('button', { name: 'Convert' }).first().click();
  const t = await body();
  check('timestamp ms detected', t.includes('milliseconds') && t.includes('2023-11-14T22:13:20.000Z'), '');
});
await T('aspect-ratio', async () => {
  await open('/tools/developer-tools/aspect-ratio');
  await page.locator('input[type="number"]').nth(0).fill('2.35'); await page.locator('input[type="number"]').nth(1).fill('1');
  check('aspect decimal', (await page.locator('.text-4xl').first().innerText()).trim() === '47:20', '');
  await page.locator('input[type="number"]').nth(1).fill('');
  check('aspect empty -> no fake ratio', (await page.locator('.text-4xl').first().innerText()).trim() === '—', '');
});
await T('json-to-xml', async () => {
  await open('/tools/developer-tools/json-to-xml');
  await ta().fill('{"id":12345678901234567890}'); await click('Convert');
  check('xml exact', (await outText()).includes('<id>12345678901234567890</id>'));
  await ta().fill('{"first name":1}'); await click('Convert');
  check('xml invalid name reported', (await body()).includes("can't be an XML"), '');
});
const JS_NO_SEMI = 'let a = 1\nlet b = 2\nfunction f() {\n  return\n  42\n}\nconsole.log(a - -b, f())';
for (const [tool, btn] of [['js-minifier', 'Minify'], ['javascript-formatter', 'Minify'], ['code-minifier', 'Minify']]) {
  await T(tool, async () => {
    await open(`/tools/developer-tools/${tool}`);
    await ta().fill(JS_NO_SEMI); await click(btn);
    const v = await waitOut((x) => x.length > 5, 30000);
    let out = null; try { out = new Function('console', v); } catch { /* syntax error */ }
    const logs = []; if (out) out({ log: (...a) => logs.push(a.join(' ')) });
    check(`${tool} keeps behaviour`, logs.join('|') === '3 ', v);
  });
}
await T('css-formatter', async () => {
  await open('/tools/developer-tools/css-formatter');
  await ta().fill('a{background:url(data:image/png;base64,AAA=)} b{c:d}'); await click('Minify');
  check('css data url intact', (await waitOut((x) => x.length > 5)).includes('url(data:image/png;base64,AAA=)'));
});
await T('sql-formatter', async () => {
  await open('/tools/developer-tools/sql-formatter');
  await ta().fill("select a, b from t -- x, y\nwhere s = 'a, b'"); await click('Format');
  const v = await waitOut((x) => x.includes('SELECT'));
  check('sql comment intact', v.includes('-- x, y') && v.includes("'a, b'"), v);
});
await T('diff-viewer', async () => {
  await open('/tools/developer-tools/diff-viewer');
  await ta(0).fill('a\nb\nc'); await ta(1).fill('x\na\nb\nc'); await click('Compare');
  await page.waitForTimeout(1500);
  const rows = await page.locator('.font-mono.text-sm > div').allInnerTexts();
  check('diff one insertion', rows.filter((r) => r.includes('+ ')).length === 1 && rows.filter((r) => r.includes('- ')).length === 0, JSON.stringify(rows));
});
await T('typescript-to-js', async () => {
  await open('/tools/developer-tools/typescript-to-js');
  await ta().fill('const o: {a: number} = { a: 1 };\nconst x = true ? o.a : 2;'); await click('Convert');
  const v = await waitOut((x) => x.includes('const'));
  check('ts object literal intact', v.includes('{ a: 1 }') && !v.includes(': number'), v);
});
await T('scss-to-css', async () => {
  await open('/tools/developer-tools/scss-to-css');
  await ta().fill('$c: red;\n.a { .b { color: $c; } }'); await click('Convert');
  check('scss compiled', (await waitOut((x) => x.includes('.a .b'), 40000)).includes('color: red'));
});
await T('markdown-to-html', async () => {
  await open('/tools/developer-tools/markdown-to-html');
  await ta().fill('| a |\n|---|\n| 1 |\n\n[l](https://x.y)'); await click('Convert');
  const v = await waitOut((x) => x.includes('<table>'));
  check('markdown table/link', v.includes('<td>1</td>') && v.includes('<a href="https://x.y">'), v);
});
await T('markdown-previewer', async () => {
  await open('/tools/developer-tools/markdown-previewer');
  await ta().fill('| a |\n|---|\n| 1 |\n\n<img src=x onerror="window.__x=1">');
  await page.waitForTimeout(1200);
  check('preview renders table', (await page.locator('table').count()) === 1);
  check('preview sanitized', !(await page.evaluate(() => window.__x)));
});
await T('xml-formatter', async () => {
  await open('/tools/developer-tools/xml-formatter');
  await ta().fill('<a><b>1</a>'); await click('Format');
  await page.waitForTimeout(800);
  check('xml invalid reported', (await body()).includes('Invalid XML'));
});
await T('code-formatter', async () => {
  await open('/tools/developer-tools/code-formatter');
  await ta().fill('{"id":12345678901234567890}'); await click('Format');
  check('code formatter json exact', (await waitOut((x) => x.includes('id'))).includes('12345678901234567890'));
});
await T('jwt-decoder', async () => {
  await open('/tools/developer-tools/jwt-decoder');
  const enc = (o) => Buffer.from(o).toString('base64url');
  await ta().fill(`${enc('{"alg":"HS256"}')}.${enc('{"id":12345678901234567890,"exp":1700000000}')}.sig`);
  await click('Decode');
  await page.waitForTimeout(500);
  const t = await body();
  check('jwt big id + exp', t.includes('12345678901234567890') && t.includes('expired'), '');
});
await T('cron', async () => {
  await open('/tools/developer-tools/cron-expression-builder');
  await page.waitForTimeout(500);
  check('cron description shown', (await body()).includes('Next runs'));
});

await T('fraction', async () => {
  await open('/tools/math-tools/fraction-calculator');
  const ins = page.locator(TEXT_IN);
  await ins.nth(0).fill('1.5'); await ins.nth(1).fill('1'); await ins.nth(2).fill('3'); await ins.nth(3).fill('4');
  await page.getByRole('button', { name: '*', exact: true }).click();
  await page.getByRole('button', { name: 'Calculate' }).click();
  const t = await body();
  check('fraction exact', t.includes('9/8') && t.includes('1 1/8') && t.includes('1.125'), '');
});
await T('statistics', async () => {
  await open('/tools/math-tools/statistics-calculator');
  await ta().fill('2 4 4 4\n5 5 7 9'); await page.getByRole('button', { name: 'Calculate' }).click();
  const t = await body();
  check('stats separators + both SD', t.includes('2.1380899353') && t.includes('Population std dev'), '');
});
await T('scientific', async () => {
  await open('/tools/math-tools/scientific-calculator');
  const inp = page.locator(TEXT_IN).first();
  await inp.fill('1/3e12'); await inp.press('Enter');
  await page.waitForTimeout(1500);
  check('scientific tiny', (await body()).includes('3.33333333333e-13'), '');
});

await T('character-counter', async () => {
  await open('/tools/text-tools/character-counter');
  await ta().fill('café 👍🏽');
  const t = await body();
  check('counter graphemes', /\b6\s*Total Characters/.test(t) || t.includes('6\nTotal Characters'), t.slice(0, 200));
});
await T('duplicate-remover', async () => {
  await open('/tools/text-tools/duplicate-remover');
  await ta().fill('a\r\nb\r\na'); await click('Remove Duplicates');
  check('dup CRLF', (await outText()) === 'a\nb', await outTa().inputValue());
});
await T('text-sorter', async () => {
  await open('/tools/text-tools/text-sorter');
  await ta().fill('zebra\néclair\nBanana\napple\nitem 10\nitem 2'); await click('Sort A-Z');
  check('sorter natural', (await outText()) === 'apple\nBanana\néclair\nitem 2\nitem 10\nzebra', await outTa().inputValue());
});
await T('find-replace', async () => {
  await open('/tools/text-tools/find-replace');
  await ta().fill('price X'); await page.locator(TEXT_IN).nth(0).fill('X'); await page.locator(TEXT_IN).nth(1).fill('US$$');
  await click('Replace All');
  check('replace literal $', (await outText()) === 'price US$$', await outTa().inputValue());
});
await T('lorem', async () => {
  await open('/tools/text-tools/lorem-ipsum');
  await page.locator('input[type="number"]').fill('200'); await page.locator(SELECT).selectOption('words');
  await click('Generate');
  check('lorem 200 words', (await outText()).split(/\s+/).length === 200);
});
await T('text-truncator', async () => {
  await open('/tools/text-tools/text-truncator');
  await ta().fill('ab😀cd'); await page.locator('input[type="number"]').fill('3'); await click('Truncate');
  check('truncate emoji whole', (await outText()) === 'ab😀...', await outTa().inputValue());
});
await T('text-comparator', async () => {
  await open('/tools/text-tools/text-comparator');
  await ta(0).fill('a\nb\nc'); await ta(1).fill('x\na\nb\nc'); await click('Compare');
  await page.waitForTimeout(1500);
  check('comparator 1 difference', (await body()).includes('1 difference(s) found'));
});
await T('text-encryptor', async () => {
  await open('/tools/text-tools/text-encryptor');
  await ta().fill('secret 😀'); await page.locator('input[type="password"]').fill('pw'); await click('Encrypt');
  const c = await waitOut((x) => x.length > 20, 20000);
  await ta(0).fill(c); await click('Decrypt');
  check('encrypt/decrypt round trip', (await waitOut((x) => x.startsWith('secret'), 20000)) === 'secret 😀');
  await page.locator('input[type="password"]').fill('wrong'); await click('Decrypt');
  await page.waitForTimeout(3000);
  check('wrong password refused', (await body()).includes('Wrong password'));
});
await T('ascii-art', async () => {
  await open('/tools/text-tools/ascii-art');
  await page.locator(TEXT_IN).fill('Hi 42!'); await click('Generate');
  await page.waitForTimeout(1500);
  const pre = await page.locator('pre').first().innerText();
  check('ascii digits rendered', pre.split('\n').length >= 5 && /\|/.test(pre), pre);
});

await T('url-parser', async () => {
  await open('/tools/developer-tools/url-parser');
  await page.locator(TEXT_IN).first().fill('https://x.y/p?tag=a&tag=b');
  await page.getByRole('button', { name: /Parse/ }).first().click();
  await page.waitForTimeout(300);
  check('url repeated keys kept', (await body()).includes('a, b'), '');
});
await T('file-encryptor', async () => {
  await open('/tools/file-tools/file-encryptor');
  await page.locator('input[type="file"]').setInputFiles({ name: 'a.bin', mimeType: 'application/octet-stream', buffer: Buffer.from([0, 1, 2, 250, 251]) });
  await page.locator('input[type="password"]').fill('pw');
  await page.getByRole('button', { name: 'Encrypt File' }).click();
  const href = await page.locator('a[download]').first().getAttribute('href', { timeout: 20000 });
  const enc = await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href);
  check('file encrypted with AES header', enc.length === 53 && String.fromCharCode(...enc.slice(0, 4)) === 'OCF1', String(enc.length));
  await page.getByRole('button', { name: 'Decrypt', exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'a.bin.encrypted', mimeType: 'application/octet-stream', buffer: Buffer.from(enc) });
  await page.locator('input[type="password"]').fill('wrong');
  await page.getByRole('button', { name: 'Decrypt File' }).click();
  await page.waitForTimeout(3000);
  check('file wrong password refused', (await body()).includes('Wrong password'), '');
});
await T('png-to-jpg transparency', async () => {
  await open('/tools/image-tools/png-to-jpg');
  const png = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const b = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await b.arrayBuffer())); });
  await page.locator('input[type="file"]').setInputFiles({ name: 't.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await page.getByRole('button', { name: 'Convert' }).click();
  const src = await page.locator('a[download="converted.jpg"]').getAttribute('href', { timeout: 20000 });
  const px = await page.evaluate(async (u) => { const bmp = await createImageBitmap(await (await fetch(u)).blob()); const c = new OffscreenCanvas(bmp.width, bmp.height); const x = c.getContext('2d'); x.drawImage(bmp, 0, 0); return Array.from(x.getImageData(1, 1, 1, 1).data); }, src).catch(async () => page.evaluate(async (u) => { const img = new Image(); img.src = u; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return Array.from(x.getImageData(1, 1, 1, 1).data); }, src));
  check('transparent -> white', px[0] > 245 && px[1] > 245 && px[2] > 245, JSON.stringify(px));
});

await T('text-to-pdf', async () => {
  await open('/tools/pdf-tools/text-to-pdf');
  await ta().fill('Line one\r\n\tindented café €\r\nLine three');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const href = await page.locator('a[download="document.pdf"]').getAttribute('href', { timeout: 20000 });
  const head = await page.evaluate(async (u) => new TextDecoder().decode((await (await fetch(u)).arrayBuffer()).slice(0, 5)), href);
  check('text-to-pdf CRLF + tab -> PDF', head === '%PDF-', head);
  await ta().fill('я 😀');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.waitForTimeout(1000);
  check('text-to-pdf unsupported chars listed', (await body()).includes("can't be written with the built-in PDF font"), '');
});

await T('pdf-rotate encrypted', async () => {
  const fs = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const os = await import('node:os');
  await open('/tools/pdf-tools/pdf-rotate');
  await page.locator('input[type="file"]').setInputFiles('scripts/converter-tests/fixtures/encrypted-aes-256.pdf');
  await page.getByRole('button', { name: 'Rotate PDF' }).click();
  const href = await page.locator('a[download$="-rotated.pdf"]').getAttribute('href', { timeout: 30000 });
  const bytes = await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href);
  const f = `${os.tmpdir()}/rot-${browserName}.pdf`;
  fs.writeFileSync(f, Buffer.from(bytes));
  let txt = ''; try { txt = execFileSync('pdftotext', [f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* unreadable */ }
  check('encrypted PDF rotated and readable', txt.includes('Hello encrypted world page 2'), txt.slice(0, 80));
  await page.locator('input[type="file"]').setInputFiles('scripts/converter-tests/fixtures/encrypted-user-password.pdf');
  await page.getByRole('button', { name: 'Rotate PDF' }).click();
  await page.waitForTimeout(2500);
  check('password PDF refused clearly', (await body()).includes('PDF Unlock'), '');
});

await T('pdf-extract-text', async () => {
  await open('/tools/pdf-tools/pdf-extract-text');
  await page.locator('input[type="file"]').setInputFiles('scripts/converter-tests/fixtures/encrypted-rc4-128.pdf');
  await page.getByRole('button', { name: /Extract/ }).first().click();
  const v = await waitOut((x) => x.includes('Page 2'), 30000);
  check('extract text per line', v.includes('Page 1:\nHello encrypted world page 1'), JSON.stringify(v.slice(0, 120)));
});

await T('image-metadata', async () => {
  await open('/tools/image-tools/image-metadata');
  await page.locator('input[type="file"]').setInputFiles('scripts/converter-tests/fixtures/exif-gps.jpg');
  await page.waitForTimeout(2500);
  const t = await body();
  check('EXIF make + GPS shown', t.includes('OnlineConvertToolsCam') && t.includes('48.858400') && t.includes('GPS location'), '');
});

await T('svg-to-png proportions', async () => {
  await open('/tools/image-tools/svg-to-png');
  await page.locator('input[type="file"]').setInputFiles({ name: 'w.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="red"/></svg>') });
  await page.waitForTimeout(800);
  const nums = page.locator('input[type="number"]');
  check('svg size from viewBox', (await nums.nth(0).inputValue()) === '512' && (await nums.nth(1).inputValue()) === '288', `${await nums.nth(0).inputValue()}x${await nums.nth(1).inputValue()}`);
  await nums.nth(0).fill('1024');
  check('svg ratio locked', (await nums.nth(1).inputValue()) === '576', await nums.nth(1).inputValue());
});

await T('png-to-ico proportions', async () => {
  await open('/tools/image-tools/png-to-ico');
  const png = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 200; c.height = 100; const x = c.getContext('2d'); x.fillStyle = '#f00'; x.fillRect(0, 0, 200, 100); const b = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await b.arrayBuffer())); });
  await page.locator('input[type="file"]').setInputFiles({ name: 'wide.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await page.getByRole('button', { name: 'Convert to ICO' }).click();
  const href = await page.locator('a[download="favicon.ico"]').getAttribute('href', { timeout: 20000 });
  // Largest frame (256): read its PNG from the ICO directory, decode, sample.
  const px = await page.evaluate(async (u) => {
    const buf = new Uint8Array(await (await fetch(u)).arrayBuffer()); const dv = new DataView(buf.buffer);
    const n = dv.getUint16(4, true); let best = null;
    for (let i = 0; i < n; i++) { const e = 6 + i * 16; const w = buf[e] || 256; if (!best || w > best.w) best = { w, size: dv.getUint32(e + 8, true), off: dv.getUint32(e + 12, true) }; }
    const bmp = await createImageBitmap(new Blob([buf.slice(best.off, best.off + best.size)], { type: 'image/png' }));
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; const x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
    return { top: Array.from(x.getImageData(128, 10, 1, 1).data), mid: Array.from(x.getImageData(128, 128, 1, 1).data) };
  }, href);
  check('ico padded, not stretched', px.top[3] === 0 && px.mid[0] > 200 && px.mid[3] === 255, JSON.stringify(px));
});

await b.close();
for (const e of errors) { fails++; console.log('PAGE ERROR', e.slice(0, 200)); }
console.log(`${passes} passed, ${fails} failed (${browserName})`);
process.exit(fails ? 1 : 0);
