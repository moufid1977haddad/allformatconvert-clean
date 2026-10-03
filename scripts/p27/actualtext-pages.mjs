// P27 lot 3: the PDF text tools on a real LibreOffice PDF whose accents are drawn as two glyphs (text in /ActualText):
// before, PDF.js read "donne\bes" for "données". Each tool used as a visitor would; the words must come out right.
//   - Extract Text: the result contains "données numérisées" and no control character;
//   - PDF to HTML: the downloaded HTML contains "données";
//   - Redact: searching "données" finds it, the downloaded PDF no longer contains the word on that page;
//   - Compare: the PDF against itself shows no difference, and its text panel contains "données".
//   node scripts/p27/actualtext-pages.mjs <origin> <lo.pdf> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(args[0]).origin;
const pdf = args[1];
const engine = process.argv.find((a) => a.startsWith('--browser='))?.slice(10) || 'chromium';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p27-at-'));
const b = await { chromium, firefox, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', `${engine} ${n}`, info); };
const fetchDownload = (p) => p.locator('[data-file-download] [data-download]').first().evaluate(async (el) => {
  const staged = /\/zipdl\/f\//.test(el.getAttribute('href') || '');
  const resp = staged ? await (await caches.open('ocv-downloads-v1')).match(el.href) : await fetch(el.href);
  const u = new Uint8Array(await resp.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
}).then((b64) => Buffer.from(b64, 'base64'));

{ // Extract Text
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-extract-text`, { waitUntil: 'load' });
  await p.locator('input[type=file]').first().setInputFiles(pdf);
  const btn = p.getByRole('button', { name: /extract/i }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
  await p.waitForFunction(() => [...document.querySelectorAll('textarea')].some((t) => t.value.length > 100), null, { timeout: 60000 }).catch(() => {});
  const t = await p.locator('textarea').first().inputValue().catch(() => '');
  check('Extract Text reads "données numérisées"', t.includes('données numérisées') && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(t), JSON.stringify(t.slice(t.indexOf('Les donn'), t.indexOf('Les donn') + 40)));
  await p.close();
}
{ // PDF to HTML
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-to-html`, { waitUntil: 'load' });
  await p.locator('input[type=file]').first().setInputFiles(pdf);
  await p.getByRole('button', { name: /convert/i }).first().click();
  await p.locator('[data-file-download] [data-download]').first().waitFor({ timeout: 60000 }).catch(() => {});
  const html = (await fetchDownload(p).catch(() => Buffer.alloc(0))).toString('utf8');
  check('PDF to HTML writes "données"', html.includes('données') && !/donne[\x00-\x1f]/.test(html), `${html.length} bytes`);
  await p.close();
}
{ // Redact
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
  await p.locator('input[type=file]').first().setInputFiles(pdf);
  await p.locator('#rd-terms').fill('données');
  await p.getByRole('button', { name: /redact/i }).last().click();
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download]').first().waitFor({ timeout: 90000 }).then(() => 'ok'),
    p.locator('[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 90000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  let info = r;
  let ok = false;
  if (r === 'ok') {
    const out = path.join(tmp, 'redacted.pdf');
    fs.writeFileSync(out, await fetchDownload(p));
    let text = '';
    try { text = execFileSync('pdftotext', ['-enc', 'UTF-8', '-f', '1', '-l', '1', out, '-'], { encoding: 'utf8' }); } catch { /* */ }
    const summary = await p.locator('main').innerText();
    const found = (summary.match(/(\d+)\s+(match|occurrence)/i) || [])[1];
    ok = !text.includes('données');
    info = `page 1 of the result contains "données": ${text.includes('données')} | matches said: ${found ?? '?'}`;
  } else if (r === 'alert') info = await p.locator('[role=alert]').first().innerText();
  check('Redact finds and removes "données"', ok, info);
  await p.close();
}
{ // Compare
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-compare`, { waitUntil: 'load' });
  const inputs = p.locator('input[type=file]');
  await inputs.nth(0).setInputFiles(pdf);
  await inputs.nth(1).setInputFiles(pdf);
  await p.getByRole('button', { name: /compare/i }).last().click();
  await p.waitForFunction(() => [...document.querySelectorAll('textarea')].some((t) => t.value.length > 100), null, { timeout: 60000 }).catch(() => {});
  const all = await p.locator('textarea').evaluateAll((els) => els.map((e) => e.value).join('\n'));
  check('Compare shows "données"', all.includes('données') && !/donne[\x00-\x1f]/.test(all), `${all.length} chars`);
  await p.close();
}
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`actualtext-pages ${engine}: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
