// Proves the fixes of the featured-tools audit on a deployed site (preview or production).
// Usage: AUDIT_FX=... AUDIT_OUT=... [AUDIT_BASE=... AUDIT_SHARE_URL=...] node scripts/audit/featured/verify-fixes.mjs
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openBrowser, openTool, upload, download, sniff, fx, BASE } from './lib.mjs';

const { browser, ctx } = await openBrowser();
const out = [];
const check = (name, ok, detail) => { out.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${JSON.stringify(detail)}`); };
// Corner pixel of a downloaded JPEG, read with Python/PIL (the transparent area of transparent.png).
const corner = (file) => execFileSync('python', ['-c', `from PIL import Image;print(Image.open(r'''${file}''').convert('RGB').getpixel((5,5)))`]).toString().trim();

// 1. Compressor must refuse to hand over a heavier "compressed" file.
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-compressor');
  await upload(page, fx('lowq.jpg'));
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  await page.waitForTimeout(3000);
  const links = await page.locator('a[download]').count();
  const msg = (await page.locator('p.text-red-400').count()) ? await page.locator('p.text-red-400').innerText() : '';
  check('image-compressor refuses a larger output', links === 0 && /not smaller/.test(msg), { links, msg });
}
// 2. Compressor: normal photo still compresses, sizes shown.
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-compressor');
  await upload(page, fx('02_animal_poil.jpg'));
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 30000 });
  const shown = await page.locator('text=/→/').first().innerText();
  const dl = await download(page, link, 'fix-compressor-photo');
  check('image-compressor photo smaller + sizes shown', dl.size < fs.statSync(fx('02_animal_poil.jpg')).size && sniff(dl.dest) === 'jpg', { size: dl.size, shown });
}
// 3. Transparent PNG -> JPEG is white, not black, in both tools.
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-compressor');
  await upload(page, fx('transparent.png'));
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  const link = page.locator('a[download]');
  await link.waitFor({ timeout: 30000 });
  const dl = await download(page, link, 'fix-compressor-transparent');
  const px = corner(dl.dest);
  check('image-compressor transparent -> white', px === '(255, 255, 255)', { px });
}
{
  const { page } = await openTool(ctx, '/tools/image-tools/image-converter');
  await upload(page, fx('transparent.png'));
  await page.locator('select:not(.goog-te-combo)').first().selectOption('jpg');
  await page.getByRole('button', { name: /^Convert/ }).first().click();
  const link = page.getByRole('button', { name: /^Download/ }).last();
  await link.waitFor({ timeout: 60000 });
  const dl = await download(page, link, 'fix-converter-transparent');
  const px = corner(dl.dest);
  check('image-converter transparent -> JPG white', px === '(255, 255, 255)' && sniff(dl.dest) === 'jpg', { px });
}
// 4. TAR: PAX/GNU records applied, never offered as files.
for (const [src, want] of [['pax.tar', ['readme.txt', 'résumé-été.txt', 'rapport-final-version-2.txt']], ['bsdtar.tar', ['été.txt']]]) {
  const { page } = await openTool(ctx, '/tools/file-tools/tar-extractor');
  await upload(page, fx(src));
  await page.locator('a[download]').first().waitFor({ timeout: 20000 });
  const names = await page.evaluate(() => [...document.querySelectorAll('a[download]')].map((a) => a.getAttribute('download')));
  const listed = await page.evaluate(() => [...document.querySelectorAll('a[download]')].map((a) => a.parentElement.innerText.split('\n')[0]));
  const d = await download(page, page.locator('a[download]').last(), `fix-tar-${src}`);
  const content = fs.readFileSync(d.dest, 'utf8');
  check(`tar-extractor ${src}: real files only, real names`, JSON.stringify(names) === JSON.stringify(want) && !/path=|mtime=/.test(content), { names, listed, lastContent: content.slice(0, 40) });
}
// 5. JSON / XML keep values exactly.
{
  const { page } = await openTool(ctx, '/tools/developer-tools/json-formatter');
  await page.locator('textarea').first().fill('{"id": 12345678901234567890, "price": 1.10}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  const out = await page.locator('textarea').nth(1).inputValue();
  check('json-formatter keeps 64-bit id and 1.10', out.includes('12345678901234567890') && out.includes('1.10'), { out });
}
{
  const { page } = await openTool(ctx, '/tools/developer-tools/xml-to-json');
  await page.locator('textarea').first().fill('<p><phone>0612345678</phone><zip>01234</zip><v>1.10</v></p>');
  await page.getByRole('button', { name: /^Convert/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('textarea')[1]?.value.length > 5, null, { timeout: 20000 });
  const out = await page.locator('textarea').nth(1).inputValue();
  check('xml-to-json keeps leading zeros and 1.10', out.includes('"0612345678"') && out.includes('"01234"') && out.includes('"1.10"'), { out: out.replace(/\s+/g, ' ') });
}
// 6. Numbers never shown wrong.
const cardText = async (page) => (await page.locator('div.bg-white.border').first().innerText()).replace(/\s+/g, ' ');
const setVal = (loc, v) => loc.evaluate((el, val) => {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(val));
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}, v);
{
  const { page } = await openTool(ctx, '/tools/math-tools/number-base-converter');
  const sel = page.locator('select:not(.goog-te-combo)').first();
  const input = page.locator('input[placeholder="Enter value..."]');
  await setVal(sel, '2'); await input.fill('1012'); await page.waitForTimeout(200);
  const bad = await cardText(page);
  await setVal(sel, '10'); await input.fill('18446744073709551615'); await page.waitForTimeout(200);
  const big = await cardText(page);
  check('number-base: 1012 (bin) invalid, 2^64-1 exact', /INVALID/i.test(bad) && !/Decimal 5\b/.test(bad) && /FFFFFFFFFFFFFFFF/i.test(big) && big.includes('18446744073709551615'), { bad: bad.slice(-120), big: big.slice(-160) });
}
{
  const { page } = await openTool(ctx, '/tools/converter-tools/unit-converter');
  const selects = page.locator('select:not(.goog-te-combo)');
  await setVal(selects.nth(0), 'mm'); await setVal(selects.nth(1), 'mile'); await setVal(page.locator('input[type=number]').first(), 1);
  await page.waitForTimeout(200);
  const a = await cardText(page);
  await setVal(selects.nth(0), 'km'); await setVal(selects.nth(1), 'inch');
  await page.waitForTimeout(200);
  const b = await cardText(page);
  check('unit-converter: 1 mm = 0.0000006213711922 mile, 1 km = 39370.07874 inch', a.includes('0.0000006213711922') && b.includes('39370.07874'), { a: a.slice(-60), b: b.slice(-60) });
}
{
  const { page } = await openTool(ctx, '/tools/math-tools/percentage-calculator');
  const n = page.locator('input[type=number]');
  await n.nth(0).fill('0.001'); await n.nth(1).fill('5');
  const t = await cardText(page);
  check('percentage: 0.001 % of 5 = 0.00005', t.includes('0.00005'), { t: t.slice(0, 80) });
}
{
  const { page } = await openTool(ctx, '/tools/math-tools/roman-numeral-converter');
  const inputs = page.locator('div.bg-white.border').first().locator('input');
  await inputs.nth(1).fill('IM');
  const t = await cardText(page);
  await inputs.nth(1).fill('mcmxciv');
  const ok = await inputs.nth(0).inputValue();
  check('roman: IM refused, MCMXCIV = 1994', /not a valid Roman numeral/.test(t) && ok === '1994', { t: t.slice(0, 160), ok });
}
{
  const api = await (await ctx.request.get('https://api.exchangerate-api.com/v4/latest/USD')).json();
  const { page } = await openTool(ctx, '/tools/converter-tools/currency-converter');
  await page.waitForFunction(() => /Rates published:/.test(document.body.innerText), null, { timeout: 20000 });
  const shown = ((await page.locator('body').innerText()).match(/Rates published: [^\n]*/) || [''])[0];
  const apiDay = new Date(api.time_last_updated * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  check('currency: shows the rates publication date', shown.includes(apiDay), { shown, apiDay });
}
// 7. Displayed counts.
{
  const res = await ctx.request.get(BASE + '/api/tool-counts');
  const counts = await res.json();
  check('/api/tool-counts total 222', counts.total === 222 && counts.counts['pdf-tools'] === 37 && counts.counts['ai-tools'] === 15, counts);
  const html = await (await ctx.request.get(BASE + '/')).text();
  check('homepage: no "225", no "190", no "No limits"', !/225\+?|\b190\b|No limits/i.test(html.replace(/rgba?\([^)]*\)/g, '')) && /222/.test(html), { has222: /222/.test(html) });
  const sm = await (await ctx.request.get(BASE + '/sitemap.xml')).text();
  const n = (sm.match(/<loc>/g) || []).length;
  check('sitemap still 240 URLs, no stubs', n === 240 && !/pdf-to-excel|pdf-to-ppt|image-generator/.test(sm), { n });
}
await browser.close();
process.exitCode = out.every((c) => c.ok) ? 0 : 1;
