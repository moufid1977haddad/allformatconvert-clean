// P24 (03/10), developer / text / units / files lot: the wrong results fixed and the options added, used as a visitor.
// Usage: node scripts/p24/dev-lot.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, createSign, createHmac, sign as edSign, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
{ // Number base: any base, exact fractions
  for (const path of ['developer-tools/number-base-converter', 'math-tools/number-base-converter']) {
    const p = await open(path);
    await p.locator('#nb-value').fill('0.1');
    const bin = await p.locator('[data-base="2"] [data-result]').innerText();
    await p.locator('#nb-from').selectOption('36'); await p.locator('#nb-value').fill('zz.i');
    const dec = await p.locator('[data-base="10"] [data-result]').innerText();
    await p.locator('#nb-to').selectOption('3'); const b3 = await p.locator('[data-base="3"] [data-result]').innerText();
    await p.locator('#nb-value').fill('z!'); const err = await p.locator('main [role=alert]').innerText().catch(() => '');
    check(`${path}: 0.1 → 0.000110011…, ZZ.I (base 36) → 1295.5, base 3 shown, bad digit refused`, bin.startsWith('0.0001100110011') && bin.endsWith('…') && dec === '1295.5' && b3 === '1202222.' + '1'.repeat(40) + '…' && /Not a number in base 36/.test(err), `${bin} ${dec} ${b3}`);
    await p.close();
  }
}
{ // Aspect ratio: missing dimension
  const p = await open('developer-tools/aspect-ratio');
  await p.locator('#ar-new-w').fill('1280'); await p.locator('#ar-new-h').fill('100');
  const h = await p.locator('[data-out="h"]').innerText(), w = await p.locator('[data-out="w"]').innerText();
  check('aspect-ratio: 16:9 at 1280 wide → 720; 100 high → 178 (exactly 177.777778)', /Height: 720$/.test(h.trim()) && /Width: 178 \(exactly 177\.777778, rounded\)/.test(w), h + ' | ' + w);
  await p.close();
}
{ // Timestamp: chosen zone, skipped hour refused
  const p = await open('developer-tools/timestamp-converter');
  await p.locator('#ts-zone').selectOption('Asia/Kolkata');
  await p.getByRole('textbox').first().fill('0');
  await p.getByRole('button', { name: 'Convert' }).first().click();
  const z = await p.locator('[data-zone]').innerText(), date = await p.getByLabel('Date and Time').inputValue();
  await p.locator('#ts-zone').selectOption('Europe/Paris');
  await p.getByLabel('Date and Time').fill('2024-03-31T02:30');
  await p.getByRole('button', { name: 'Convert' }).nth(1).click();
  const gap = await main(p);
  check('timestamp: 0 in Kolkata = 05:30 (UTC+05:30); 02:30 on 31/03/2024 in Paris refused (skipped hour)', /05:30:00 \(UTC\+05:30\)/.test(z) && /^1970-01-01T05:30(:00)?$/.test(date) && /does not exist in Europe\/Paris/.test(gap), z + ' ' + date);
  await p.close();
}
{ // Word counter: density
  const p = await open('text-tools/word-counter');
  await p.locator('textarea').fill('The cat saw the cat. A cat and a dog. The dog ran.');
  const rows = await p.locator('[data-density] tbody tr').allInnerTexts();
  await p.getByRole('button', { name: '2 words' }).click();
  const two = await p.locator('[data-density]').innerText();
  check('word-counter: "cat" 3 × 23.1 % of 13 words, stop words left out; no 2-word phrase repeated → sentence', /^cat\s+3\s+23\.1 %/.test(rows[0]) && !rows.some((r) => /^the\b/.test(r)) && /No 2-word phrase appears more than once/.test(two), rows.slice(0, 3).join(' / '));
  await p.close();
}
{ // Cron: paste
  const p = await open('developer-tools/cron-expression-builder');
  await p.locator('#cron-paste').fill('30 4 * * 1-5 /usr/bin/backup.sh');
  const vals = await Promise.all(['Minute', 'Hour', 'Day', 'Month', 'Weekday'].map((l) => p.getByLabel(l, { exact: true }).inputValue()));
  const note = await p.locator('[data-cron-note]').innerText();
  await p.locator('#cron-paste').fill('0 15 10 ? * MON-FRI');
  const q = await p.locator('[data-cron-note]').innerText();
  check('cron: crontab line split into 5 fields, command left out and said; Quartz explained', vals.join(' ') === '30 4 * * 1-5' && /command/.test(note) && /6 fields/.test(q), vals.join(' '));
  await p.close();
}
{ // Color: alpha + contrast
  const p = await open('converter-tools/color-converter');
  await p.locator('#cc-hex').fill('#3b82f680');
  const rgb = await p.locator('[data-css="rgb"]').innerText(), hsl = await p.locator('[data-css="hsl"]').innerText();
  const c = await p.locator('[data-contrast]').innerText();
  check('color: #3b82f680 → rgba(59, 130, 246, 0.502), hsla; contrast on white 3.68:1 (AA large only)', rgb === 'rgba(59, 130, 246, 0.502)' && /^hsla\(/.test(hsl) && /3\.68:1 — AA large text only/.test(c), rgb + ' ' + c.replace(/\n/g, ' '));
  await p.close();
}
{ // Unit converter: fuel economy
  const p = await open('converter-tools/unit-converter');
  await p.getByRole('button', { name: 'Fuel economy', exact: true }).click();
  await p.locator('#uc-from').selectOption('mpg (US)'); await p.locator('#uc-to').selectOption('L/100 km');
  await p.locator('main input').first().fill('30');
  const r = await p.locator('[data-result]').innerText();
  await p.locator('main input').first().fill('0');
  const z = await main(p);
  check('unit-converter: 30 mpg (US) = 7.84048611111 L/100 km; 0 refused', /^7\.840486111/.test(r) && /must be more than 0/.test(z), r);
  await p.close();
}
{ // JWT: signature verification against tokens signed by Node's crypto
  const b64u = (x) => Buffer.from(x).toString('base64url');
  const body = (alg) => b64u(JSON.stringify({ alg, typ: 'JWT' })) + '.' + b64u(JSON.stringify({ sub: '1234567890', exp: 4102444800 }));
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 }), ec = generateKeyPairSync('ec', { namedCurve: 'P-256' }), ed = generateKeyPairSync('ed25519');
  const rsPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }), ecJwk = JSON.stringify(ec.publicKey.export({ format: 'jwk' }));
  const rs = body('RS256') + '.' + b64u(createSign('SHA256').update(body('RS256')).sign(rsa.privateKey));
  const es = body('ES256') + '.' + b64u(createSign('SHA256').update(body('ES256')).sign({ key: ec.privateKey, dsaEncoding: 'ieee-p1363' }));
  const hs = body('HS256') + '.' + createHmac('sha256', 'a-string-secret-at-least-256-bits-long').update(body('HS256')).digest('base64url');
  const eds = body('EdDSA') + '.' + b64u(edSign(null, Buffer.from(body('EdDSA')), ed.privateKey));
  const tampered = rs.split('.').map((x, i) => (i === 1 ? b64u(JSON.stringify({ sub: 'admin', exp: 4102444800 })) : x)).join('.');
  const confusion = body('HS256') + '.' + createHmac('sha256', rsPem).update(body('HS256')).digest('base64url');
  const p = await open('developer-tools/jwt-decoder');
  const run = async (tok, key) => {
    await p.locator('textarea').first().fill(tok); await p.locator('#jwt-key').fill(key);
    await p.getByRole('button', { name: 'Verify signature' }).click();
    const v = p.locator('[data-verdict]'); await v.waitFor({ timeout: 10000 });
    return [await v.getAttribute('data-verdict'), await v.innerText()];
  };
  const r1 = await run(rs, rsPem), r2 = await run(tampered, rsPem), r3 = await run(es, ecJwk), r4 = await run(hs, 'a-string-secret-at-least-256-bits-long');
  const r5 = await run(hs, 'wrong'), r6 = await run(confusion, rsPem), r7 = await run(eds, ed.publicKey.export({ type: 'spki', format: 'pem' }));
  const edOk = r7[0] === 'valid' || (r7[0] === 'error' && /cannot verify Ed25519/.test(r7[1]));
  check('jwt: RS256 PEM valid, tampered invalid, ES256 JWK valid, HS256 right/wrong secret, alg confusion refused, EdDSA valid or said unsupported',
    r1[0] === 'valid' && r2[0] === 'invalid' && r3[0] === 'valid' && r4[0] === 'valid' && r5[0] === 'invalid' && r6[0] === 'error' && /algorithm confusion/.test(r6[1]) && edOk,
    [r1, r2, r3, r4, r5, r6, r7].map((r) => r[0]).join(' ') + (r7[0] === 'error' ? ' (Ed25519: ' + r7[1].slice(0, 50) + ')' : ''));
  await p.close();
}
{ // ZIP Creator: AES-256 password, opened by an independent reader (Windows bsdtar / libarchive)
  const BSDTAR = 'C:/Windows/System32/tar.exe';
  if (!fs.existsSync(BSDTAR)) console.log('SKIP zip-creator AES: no bsdtar (Windows tar.exe) to open the archive independently');
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-zip-'));
    const txt = path.join(dir, 'notes été.txt'), bin = path.join(dir, 'data.bin');
    fs.writeFileSync(txt, 'Bonjour — ünïcödé\n'.repeat(500)); fs.writeFileSync(bin, randomBytes(300000));
    const p = await open('file-tools/zip-creator');
    await p.locator('input[type=file]').first().setInputFiles([txt, bin]);
    await p.locator('#zip-use-password').check();
    await p.locator('#zip-password').fill('s3cret-pass 2026'); await p.locator('#zip-password2').fill('s3cret-pass 2026');
    await p.getByRole('button', { name: 'Create ZIP' }).click();
    const link = p.locator('a[download]').first(); await link.waitFor({ timeout: 60000 });
    const [dl] = await Promise.all([p.waitForEvent('download'), link.click()]);
    const zip = path.join(dir, 'archive.zip'); await dl.saveAs(zip);
    const bytes = fs.readFileSync(zip), method = bytes.readUInt16LE(8);
    const out = path.join(dir, 'out'); fs.mkdirSync(out);
    const good = spawnSync(BSDTAR, ['-xf', zip, '-C', out, '--passphrase', 's3cret-pass 2026'], { encoding: 'utf8' });
    const same = good.status === 0 && fs.readFileSync(path.join(out, 'data.bin')).equals(fs.readFileSync(bin)) && fs.readFileSync(path.join(out, 'notes été.txt')).equals(fs.readFileSync(txt));
    const out2 = path.join(dir, 'out2'); fs.mkdirSync(out2);
    const bad = spawnSync(BSDTAR, ['-xf', zip, '-C', out2, '--passphrase', 'wrong'], { encoding: 'utf8' });
    const badOk = bad.status !== 0 || !fs.existsSync(path.join(out2, 'data.bin')) || !fs.readFileSync(path.join(out2, 'data.bin')).equals(fs.readFileSync(bin));
    await p.locator('#zip-password2').fill('different');
    const blocked = await p.getByRole('button', { name: 'Create ZIP' }).isDisabled();
    check('zip-creator: AES-256 (method 99) archive opened by bsdtar with the password, byte-exact; wrong password refused; mismatched passwords block', method === 99 && same && badOk && blocked, `method ${method}, bsdtar ${good.status} ${(good.stderr || '').slice(0, 80)}, wrong → ${bad.status}`);
    await p.close();
  }
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
