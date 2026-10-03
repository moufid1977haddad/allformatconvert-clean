// P29 (04/10): HTML to PDF page, file and pasted-code modes: a PDF is delivered, and the "scripts are not run" notice
// appears exactly when the HTML has a <script>. One pass on the preview (or www), Chromium.
//   node scripts/p29/html-page.mjs <origin>
import { chromium } from '@playwright/test';

const origin = new URL(process.argv[2]).origin;
const withScript = '<!doctype html><html><body><h1>P29 page test</h1><p id="t">static text</p><script>document.getElementById("t").textContent="built by script"</script></body></html>';
const plain = '<!doctype html><html><body><h1>P29 page test</h1><p>static text, no script</p></body></html>';
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function run(name, mode, html, expectNotice) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/html-to-pdf`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  if (mode === 'paste') {
    await p.getByRole('button', { name: 'Paste Code' }).click();
    await p.locator('textarea').first().fill(html);
  } else {
    await p.locator('input[type=file]').first().setInputFiles({ name: `${name}.html`, mimeType: 'text/html', buffer: Buffer.from(html) });
  }
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const state = await Promise.race([
    p.locator('[data-file-download] [data-download], a[download]').first().waitFor({ timeout: 120000 }).then(() => 'ok'),
    p.locator('p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 120000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  let head = '';
  if (state === 'ok') {
    const a = p.locator('[data-file-download] [data-download], a[download]').first();
    head = await a.evaluate(async (el) => { const r = await fetch(el.href); const t = new Uint8Array(await r.arrayBuffer()); return String.fromCharCode(...t.slice(0, 5)) + ' ' + t.length; });
  }
  if (expectNotice) await p.locator('[data-notice]').first().waitFor({ timeout: 5000 }).catch(() => {});
  else await p.waitForTimeout(1500);
  const notice = await p.locator('[data-notice]').count() ? await p.locator('[data-notice]').innerText() : '';
  check(`${name} PDF`, state === 'ok' && head.startsWith('%PDF-'), `${state} ${head}`);
  check(`${name} notice`, expectNotice ? /scripts, which are not run/.test(notice) : notice === '', notice.slice(0, 60) || '(none)');
  await p.close();
}
await run('file-with-script', 'file', withScript, true);
await run('file-plain', 'file', plain, false);
await run('paste-with-script', 'paste', withScript, true);
await b.close();
console.log(`html-page ${origin}: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
