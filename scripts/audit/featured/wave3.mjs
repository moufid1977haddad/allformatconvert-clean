// Wave 3 of the featured-tools audit: ZIP Extractor, ZIP Creator, TAR Extractor, Barcode Generator,
// JSON Formatter, XML to JSON, Hash Generator, Word Counter, Case Converter, Text Reverser.
// Usage: AUDIT_FX=<dir> AUDIT_OUT=<dir> node scripts/audit/featured/wave3.mjs [toolFilter]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { openBrowser, openTool, upload, download, sniff, fx, OUT } from './lib.mjs';

const only = process.argv[2];
const results = [];
const { browser, ctx } = await openBrowser();
async function scenario(name, fn) {
  if (only && !name.startsWith(only)) return;
  const t0 = Date.now();
  try { results.push({ scenario: name, ...(await fn()) }); }
  catch (e) { results.push({ scenario: name, exception: String(e).slice(0, 300) }); }
  results.at(-1).secs = +((Date.now() - t0) / 1000).toFixed(1);
  console.log(JSON.stringify(results.at(-1)).replace(/"dest":"[^"]*",/g, ''));
}
const dialogs = (page) => { const seen = []; page.on('dialog', (d) => { seen.push(d.message()); d.dismiss().catch(() => {}); }); return seen; };
const listed = (page) => page.evaluate(() => [...document.querySelectorAll('a[download]')].map((a) => a.getAttribute('download') + ' <- ' + (a.closest('div')?.innerText || '').replace(/\s+/g, ' ').slice(0, 160)));

for (const src of ['bundle.zip', 'unicode.zip']) {
  await scenario(`zip-extractor:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/file-tools/zip-extractor');
    const dl = dialogs(page);
    await upload(page, fx(src));
    await page.waitForTimeout(3000);
    const items = await listed(page);
    const first = items.length ? await download(page, page.locator('a[download]').first(), `zip-extractor-${src}`) : null;
    return { items, dialogs: dl, first, errors };
  });
}

await scenario('zip-creator', async () => {
  const { page, errors } = await openTool(ctx, '/tools/file-tools/zip-creator');
  await upload(page, [fx('arxiv-attention.pdf'), fx('01_portrait_cheveux.jpg'), fx('clip30.mp3')]);
  await page.getByRole('button', { name: 'Create ZIP' }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 60000 });
  const d = await download(page, link, 'zip-creator');
  return { d, kind: sniff(d.dest), errors };
});

for (const src of ['bundle.tar', 'bundle.tar.gz', 'pax.tar', 'gnu.tar', 'bsdtar.tar']) {
  await scenario(`tar-extractor:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/file-tools/tar-extractor');
    const dl = dialogs(page);
    await upload(page, fx(src));
    await page.waitForTimeout(3000);
    const items = await listed(page);
    const saved = [];
    const n = await page.locator('a[download]').count();
    for (let i = 0; i < n; i++) saved.push(await download(page, page.locator('a[download]').nth(i), `tar-${src}-${i}`));
    return { items, saved: saved.map((s) => ({ name: s.name, size: s.size, head: fs.readFileSync(s.dest).subarray(0, 60).toString('utf8').replace(/\0/g, '·') })), dialogs: dl, errors };
  });
}

for (const [fmt, value] of [['CODE128', 'ABC-12345'], ['EAN13', '590123412345'], ['UPC', '03600029145'], ['EAN13', '5901234123458'], ['EAN13', '5901234123450']]) {
  await scenario(`barcode-generator:${fmt}:${value}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/qr-barcodes-tools/barcode-generator');
    await page.locator('input[placeholder="Enter text or number..."]').fill(value);
    await page.locator('select:not(.goog-te-combo)').first().selectOption(fmt);
    await page.getByRole('button', { name: 'Generate Barcode' }).click();
    await page.waitForTimeout(1500);
    const status = await page.evaluate(() => [...document.querySelectorAll('p')].map((p) => p.innerText).filter((t) => /invalid|fail|error/i.test(t)).join(' | '));
    const png = page.locator('a[download="barcode.png"]');
    const d = (await png.count()) ? await download(page, png, `barcode-${fmt}-${value}`) : null;
    return { status, d, kind: d && sniff(d.dest), errors };
  });
}

const BIG = '{"id": 12345678901234567890, "price": 1.10, "exp": 1e21, "name": "caf\\u00e9", "nested": {"list": [1, 2.50, true, null], "empty": {}}}';
for (const action of ['Format', 'Minify']) {
  await scenario(`json-formatter:${action}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/developer-tools/json-formatter');
    await page.locator('textarea').first().fill(BIG);
    await page.getByRole('button', { name: action, exact: true }).click();
    const out = await page.locator('textarea').nth(1).inputValue();
    return { input: BIG, out, keeps64bitId: out.includes('12345678901234567890') };
  });
}
await scenario('json-formatter:invalid', async () => {
  const { page } = await openTool(ctx, '/tools/developer-tools/json-formatter');
  await page.locator('textarea').first().fill('{\n  "a": 1,\n  "b": [1, 2,,3]\n}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  return { shown: await page.evaluate(() => [...document.querySelectorAll('p')].map((p) => p.innerText).filter((t) => /invalid/i.test(t)).join(' | ')) };
});

const XML = '<?xml version="1.0"?><contacts><person id="7"><name>Anna</name><phone>0612345678</phone><zip>01234</zip><account>12345678901234567890</account><note>  spaced  </note></person></contacts>';
await scenario('xml-to-json', async () => {
  const { page, errors } = await openTool(ctx, '/tools/developer-tools/xml-to-json');
  await page.locator('textarea').first().fill(XML);
  await page.getByRole('button', { name: /^Convert/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('textarea')[1]?.value.length > 5, null, { timeout: 20000 });
  const out = await page.locator('textarea').nth(1).inputValue();
  return { input: XML, out: out.replace(/\s+/g, ' ') };
});

const HASH_IN = 'Déjà vu 👋 — hash me';
await scenario('hash-generator', async () => {
  const { page, errors } = await openTool(ctx, '/tools/developer-tools/hash-generator');
  await page.locator('[placeholder="Enter text to hash..."]').fill(HASH_IN);
  await page.getByRole('button', { name: 'Generate Hashes' }).click();
  await page.waitForTimeout(800);
  const body = await page.locator('body').innerText();
  const expect = Object.fromEntries(['sha1', 'sha256', 'sha512', 'md5'].map((a) => [a, crypto.createHash(a).update(HASH_IN, 'utf8').digest('hex')]));
  return { expect_ok: Object.fromEntries(Object.entries(expect).map(([k, v]) => [k, body.includes(v)])), fileInput: await page.locator('input[type=file]').count() };
});

const TEXT = 'Hello world. This is a test, e.g. version 3.14 of it!\n\nSecond paragraph here? Yes.\n東京は大きい都市です。';
await scenario('word-counter', async () => {
  const { page } = await openTool(ctx, '/tools/text-tools/word-counter');
  await page.locator('textarea').first().fill(TEXT);
  // The stat tiles are "<value>\n<label>" pairs right after the textarea.
  const lines = (await page.locator('body').innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
  const stats = lines.flatMap((l, i) => (/^\d+$/.test(l) && lines[i + 1] && /[a-z]/i.test(lines[i + 1]) ? [`${lines[i + 1]}=${l}`] : [])).slice(0, 8);
  return { text: TEXT, stats };
});

const CASE_IN = 'the lord of the rings. an epic by j.r.r. tolkien! is it good? i think so.';
for (const b of ['UPPERCASE', 'Title Case', 'Sentence case']) {
  await scenario(`case-converter:${b}`, async () => {
    const { page } = await openTool(ctx, '/tools/text-tools/case-converter');
    await page.locator('textarea').first().fill(CASE_IN);
    await page.getByRole('button', { name: b, exact: true }).click();
    return { out: await page.locator('textarea').first().inputValue() };
  });
}

const REV_IN = 'Café 👋🏽 naïve 🇫🇷';
for (const b of ['Reverse Text', 'Reverse Words']) {
  await scenario(`text-reverser:${b}`, async () => {
    const { page } = await openTool(ctx, '/tools/text-tools/text-reverser');
    await page.locator('textarea').first().fill(REV_IN);
    await page.getByRole('button', { name: b, exact: true }).click();
    const out = await page.locator('textarea').nth(1).inputValue().catch(async () => page.locator('body').innerText());
    return { input: REV_IN, out, loneSurrogate: /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(out) };
  });
}

fs.writeFileSync(path.join(OUT, `wave3-results${only ? '-' + only.replace(/[^a-z0-9-]/gi, '_') : ''}.json`), JSON.stringify(results, null, 2));
await browser.close();
