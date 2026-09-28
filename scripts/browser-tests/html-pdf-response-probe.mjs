// Firefox reservation of deploiement 2 (28/09): HTML, EPUB and MOBI to PDF got an EMPTY answer through the local test
// relay on the preview. This probe reads what the browser really receives from /api/convert-html-to-pdf (status,
// headers, body size, %PDF- magic) for the three tools, on any origin (www, a local build, the relay), any engine.
// It works with both interfaces (automatic download on www today, Download button since deploiement 2).
// Usage: node scripts/browser-tests/html-pdf-response-probe.mjs <origin> [--browser=firefox|chromium|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=firefox').slice(10);
const FX = path.resolve('scripts/audit/fixtures/files');
const T = [['html-to-pdf', `${FX}/sample.html`], ['epub-to-pdf', `${FX}/sample.epub`], ['mobi-to-pdf', `${FX}/sample.mobi`]];
let fails = 0;
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
// What the PAGE receives (Playwright's own response.body() is unreliable once the page has consumed the body).
await ctx.addInitScript(() => {
  const f = window.fetch;
  window.__probe = [];
  window.fetch = async (...a) => {
    const res = await f(...a);
    if (String(a[0]).includes('/api/convert-html-to-pdf')) {
      const c = res.clone();
      c.arrayBuffer().then((buf) => { const u = new Uint8Array(buf); window.__probe.push({ status: res.status, size: u.length, magic: String.fromCharCode(...u.slice(0, 5)) }); },
        (e) => window.__probe.push({ status: res.status, error: String(e) }));
    }
    return res;
  };
});
for (const [tool, input] of T) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(180000);
  await p.goto(`${origin}/tools/pdf-tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(input);
  await p.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => /^(Convert|Download)/.test(x.textContent.trim()) && !x.disabled));
  const respP = p.waitForResponse((r) => r.url().includes('/api/convert-html-to-pdf') && r.request().method() === 'POST');
  await p.locator('button', { hasText: /^(Convert|Download)/ }).first().click();
  const r = await respP;
  const req = r.request();
  const reqBody = req.postDataBuffer();
  await p.waitForFunction(() => window.__probe.length > 0);
  const seen = (await p.evaluate(() => window.__probe))[0];
  const h = r.headers();
  const ok = seen.status === 200 && seen.magic === '%PDF-';
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', name, tool, `page saw: status ${seen.status}, body ${seen.size} B, magic ${JSON.stringify(seen.magic)}${seen.error ? ' ' + seen.error : ''}`,
    `content-type ${h['content-type']}`, `content-length ${h['content-length'] ?? '-'}`, `transfer-encoding ${h['transfer-encoding'] ?? '-'}`,
    `| request ${reqBody ? reqBody.length : '?'} B, content-type ${(req.headers()['content-type'] || '').slice(0, 40)}`);
  await p.waitForTimeout(1500);
  const shown = (await p.locator('[role=alert], .text-red-500, .text-red-600').allInnerTexts().catch(() => [])).join(' | ');
  if (shown) console.log('  on screen:', shown);
  await p.close();
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${name}, ${origin})`);
process.exit(fails ? 1 : 0);
