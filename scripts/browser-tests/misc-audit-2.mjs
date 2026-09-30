// File tools and MOBI to EPUB, audit of 29/09 (second pass): each check states the CORRECT behaviour; run against
// the build before the fixes it shows the defects, after them it must pass.
// Usage: node scripts/browser-tests/misc-audit-2.mjs <origin> [--browser=chromium|firefox|webkit] [--only=<name>]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import JSZip from 'jszip';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const b = await ({ chromium, firefox, webkit })[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
let fails = 0, passes = 0;
const errors = [];
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
let page;
const open = async (p) => { page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${p}: ${e.message}`)); await page.goto(origin + p, { waitUntil: 'networkidle' }); };
const T = async (n, fn) => { if (only && !n.startsWith(only)) return; try { await fn(); } catch (e) { fails++; console.log('FAIL', `${name} ${n}`, String(e.message).split('\n')[0].slice(0, 200)); } finally { if (page) await page.close().catch(() => {}); page = null; } };
const hrefBytes = async (href) => Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href));

await T('mobi-to-epub', async () => {
  await open('/tools/converter-tools/mobi-to-epub');
  await page.locator('input[type="file"]').first().setInputFiles('scripts/audit/fixtures/files/sample.mobi');
  await page.getByRole('button', { name: /Convert/ }).first().click();
  const href = await page.locator('a[download$=".epub"]').first().getAttribute('href', { timeout: 60000 });
  const zip = await JSZip.loadAsync(await hrefBytes(href));
  const missing = [], blobs = [];
  let refs = 0;
  for (const p of Object.keys(zip.files).filter((f) => /\.x?html$/.test(f))) {
    const x = await zip.files[p].async('text');
    if (/blob:/.test(x)) blobs.push(p);
    for (const m of x.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
      refs++;
      const target = new URL(m[1], 'file:///' + p).pathname.slice(1);
      if (!zip.files[decodeURIComponent(target)]) missing.push(`${p} -> ${m[1]}`);
    }
  }
  check('mobi-to-epub: every image and stylesheet a chapter references exists in the EPUB (relative paths)', refs > 0 && missing.length === 0, `${refs} references, ${missing.length} missing: ${missing.slice(0, 3).join(' | ')}`);
  check('mobi-to-epub: no blob: address left in the EPUB', blobs.length === 0, blobs.slice(0, 3).join(' '));
  // Oracle for the table of contents: the book's own TOC read by the same parser here (it writes its images in
  // the working directory: run from a temporary one).
  const os = await import('node:os'); const path = await import('node:path');
  const here = process.cwd(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mobitoc-'));
  const mobiPath = path.resolve('scripts/audit/fixtures/files/sample.mobi');
  process.chdir(tmp);
  let tocLabels = [];
  try {
    const { initMobiFile } = await import('@lingo-reader/mobi-parser');
    const book = await initMobiFile(mobiPath);
    const flat = (items) => (items || []).flatMap((t) => [t.label, ...flat(t.children)]);
    tocLabels = flat(book.getToc()).map((l) => (l || '').trim()).filter(Boolean);
  } finally { process.chdir(here); }
  const nav = await zip.files['OEBPS/nav.xhtml'].async('text');
  const navLabels = [...nav.matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map((m) => m[1].replace(/&amp;/g, '&').trim());
  const kept = tocLabels.filter((l) => navLabels.includes(l));
  check('mobi-to-epub: the EPUB table of contents uses the book\'s own chapter titles (as Calibre)', tocLabels.length === 0 || kept.length >= Math.min(3, tocLabels.length), `book TOC: ${tocLabels.slice(0, 4).join(' / ')} ; EPUB: ${navLabels.slice(0, 4).join(' / ')}`);
});

// A MOBI whose chapter shows an image (fixtures/make-mobi-with-image.mjs): the sample above has none.
const { mobiWithImage } = await import('./fixtures/make-mobi-with-image.mjs');
await T('mobi-to-epub image', async () => {
  await open('/tools/converter-tools/mobi-to-epub');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'pictures.mobi', mimeType: 'application/x-mobipocket-ebook', buffer: mobiWithImage() });
  await page.getByRole('button', { name: /Convert/ }).first().click();
  const href = await page.locator('a[download$=".epub"]').first().getAttribute('href', { timeout: 60000 });
  const zip = await JSZip.loadAsync(await hrefBytes(href));
  const imgs = [];
  for (const p of Object.keys(zip.files).filter((f) => /text\/.*\.xhtml$/.test(f))) {
    const x = await zip.files[p].async('text');
    for (const m of x.matchAll(/<img[^>]*src="([^"]+)"/g)) { const t = new URL(m[1], 'file:///' + p).pathname.slice(1); imgs.push(`${m[1]} -> ${zip.files[t] ? 'found' : 'MISSING'}`); }
  }
  check('mobi-to-epub: the chapter image resolves to the image file inside the EPUB', imgs.length > 0 && imgs.every((s) => s.endsWith('found')), imgs.join(' | ') || 'no <img> in chapters');
});
await T('mobi-to-pdf image', async () => {
  await open('/tools/pdf-tools/mobi-to-pdf');
  let sent = null;
  // The rendering service PLAYED in the page (Playwright's WebKit does not give the multipart file part to route()):
  // the HTML file posted to /api/convert-html-to-pdf is kept in window.__sentHtml and a one-page PDF is answered.
  await page.evaluate(() => {
    const real = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (/\/api\/convert-html-to-pdf/.test(url) && init && init.body instanceof FormData) {
        window.__sentHtml = await init.body.get('file').text();
        const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 10 10]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n';
        return new Response(new Blob([pdf], { type: 'application/pdf' }), { status: 200, headers: { 'Content-Type': 'application/pdf' } });
      }
      return real(input, init);
    };
  });
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'pictures.mobi', mimeType: 'application/x-mobipocket-ebook', buffer: mobiWithImage() });
  await page.getByRole('button', { name: /Convert/ }).first().click();
  for (let t = 0; t < 120 && sent === null; t++) { await page.waitForTimeout(500); sent = await page.evaluate(() => window.__sentHtml ?? null); }
  check('mobi-to-pdf: the chapter image is inlined in the HTML sent for rendering (service played here)', !!sent && /data:image\/png;base64,/.test(sent) && !/blob:/.test(sent), sent ? `${sent.length} bytes` : 'nothing sent');
});

await T('file-comparator', async () => {
  await open('/tools/file-tools/file-comparator');
  const a = Buffer.alloc(20 * 1024 * 1024, 7), bb = Buffer.from(a); bb[17 * 1024 * 1024 + 5] = 8;
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles({ name: 'a.bin', mimeType: 'application/octet-stream', buffer: a });
  await inputs.nth(1).setInputFiles({ name: 'b.bin', mimeType: 'application/octet-stream', buffer: bb });
  await page.getByRole('button', { name: /Compare/ }).click();
  await page.locator('div.text-2xl', { hasText: /Files are (identical|different)/ }).waitFor({ timeout: 30000 });
  const where = await page.locator('[data-first-diff]').textContent({ timeout: 3000 }).catch(() => '');
  check('file-comparator: says where two files differ (first differing byte, as cmp)', /17,825,798|17825798/.test(where), where || 'no position given');
  await inputs.nth(1).setInputFiles({ name: 'a-copy.bin', mimeType: 'application/octet-stream', buffer: a });
  const stale = await page.locator('div.text-2xl', { hasText: 'Files are different' }).count();
  check('file-comparator: picking another file clears the previous verdict', stale === 0, `old verdict still shown: ${stale}`);
});

await T('file-metadata', async () => {
  await open('/tools/file-tools/file-metadata');
  const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200, 0)]);
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'holiday-photo.jpg', mimeType: 'image/jpeg', buffer: exe });
  await page.waitForTimeout(800);
  const body = await page.locator('main, body').first().innerText();
  check('file-metadata: a program renamed .jpg is recognized as a program, with a warning', /Windows program/.test(body) && /Check where this file comes from/.test(body), body.match(/(Type[^\n]*\n[^\n]*|Real format[^\n]*\n[^\n]*)/g)?.join(' | ') || '');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'README', mimeType: '', buffer: Buffer.from('hello') });
  await page.waitForTimeout(800);
  const ext = await page.locator('[data-meta="extension"]').textContent({ timeout: 3000 }).catch(async () => (await page.locator('main, body').first().innerText()).match(/Extension\s*\n?\s*(\S+)/)?.[1] || '');
  check('file-metadata: a name without a dot has no extension (not the whole name)', ext === '(none)', ext);
});

await T('base64-encoder', async () => {
  await open('/tools/file-tools/base64-encoder');
  const heicHead = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.alloc(40, 0)]);
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'IMG_0001', mimeType: '', buffer: heicHead });
  await page.waitForTimeout(800);
  const v = await page.locator('textarea').first().inputValue();
  check('base64-encoder: a file the browser has no type for gets its real type in the data URL', v.startsWith('data:image/heic;base64,'), v.slice(0, 40));
  const rawBtn = page.getByRole('button', { name: 'Raw Base64' });
  if (await rawBtn.count()) await rawBtn.click();
  const raw = await page.locator('textarea').first().inputValue();
  check('base64-encoder: raw Base64 without the data: prefix is offered', raw === heicHead.toString('base64'), raw.slice(0, 40));
});

// AI tools with /api/ai PLAYED here (route intercepted): no call reaches OpenAI, nothing is paid.
await T('ai-chatbot', async () => {
  await open('/tools/ai-tools/ai-chatbot');
  const prompts = [];
  await page.route('**/api/ai', async (route) => {
    prompts.push(JSON.parse(route.request().postData()).prompt);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: prompts.length === 1 ? 'Paris is the capital.\n- line two\n- line three' : 'About 2.1 million.' }) });
  });
  const box = page.locator('input[type="text"]:visible, textarea:visible').last();
  await box.fill('What is the capital of France?'); await box.press('Enter');
  if (prompts.length === 0) await page.getByRole('button', { name: /Send/ }).click().catch(() => {});
  await page.getByText('Paris is the capital.', { exact: false }).waitFor({ timeout: 10000 });
  await box.fill('And its population?'); await box.press('Enter');
  if (prompts.length < 2) await page.getByRole('button', { name: /Send/ }).click().catch(() => {});
  await page.getByText('About 2.1 million.').waitFor({ timeout: 10000 });
  check('ai-chatbot: the second message is sent with the conversation so far (the model knows "its" is France)', /capital of France/.test(prompts[1] || '') && /Paris is the capital/.test(prompts[1] || ''), JSON.stringify((prompts[1] || '').slice(0, 160)));
  const ws = await page.getByText('Paris is the capital.', { exact: false }).first().evaluate((el) => getComputedStyle(el).whiteSpace);
  check('ai-chatbot: an answer on several lines keeps its line breaks', /pre/.test(ws), ws);
});
await T('ai-detector', async () => {
  await open('/tools/ai-tools/ai-detector');
  // 30/09 (RAPPORT-ai-detector-30-09.md): detection by Pangram through /api/ai-detect; the route is played here (no cost)
  await page.route('**/api/ai-detect', (route) => route.fulfill({ status: 504, contentType: 'text/html', body: '<html><body>Gateway Timeout</body></html>' }));
  const para = 'The quick brown fox jumps over the lazy dog while the farmer watches from the old wooden porch. '.repeat(3);
  await page.getByPlaceholder('Paste text to analyze...').fill(para);
  await page.getByRole('button', { name: 'Detect AI Content' }).click();
  await page.waitForTimeout(1500);
  const err = await page.locator('p.text-red-400').first().textContent().catch(() => '');
  check('ai tools: a gateway error page gives a readable message, not a JSON parse error', /did not answer correctly \(HTTP 504\)/.test(err) && !/Unexpected token/.test(err), err);
  const play = async (body, status = 200) => { await page.unroute('**/api/ai-detect'); await page.route('**/api/ai-detect', (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })); await page.getByRole('button', { name: 'Detect AI Content' }).click(); await page.waitForTimeout(1000); };
  await play({ verdict: 'ai', fractionAi: 0.93, fractionAiAssisted: 0.05, fractionHuman: 0.02, headline: 'AI Detected', words: 57 });
  check('ai-detector: Pangram says AI -> "Likely written by AI", with the shares and the caveat', (await page.locator('[data-verdict]').getAttribute('data-verdict')) === 'ai' && /AI-written: 93 %.*AI-assisted: 5 %.*Human: 2 %/s.test(await page.locator('[data-shares]').innerText()) && await page.locator('[data-caveat]').count() === 1);
  await play({ verdict: 'human', fractionAi: 0, fractionAiAssisted: 0, fractionHuman: 1, headline: 'Human', words: 57 });
  check('ai-detector: Pangram says human -> "Likely written by a person"', (await page.locator('[data-verdict]').getAttribute('data-verdict')) === 'human');
  await play({ verdict: 'mixed', fractionAi: 0.4, fractionAiAssisted: 0.1, fractionHuman: 0.5, headline: 'Mixed', words: 57 });
  check('ai-detector: Pangram says mixed -> "Mix of AI and human writing"', (await page.locator('[data-verdict]').getAttribute('data-verdict')) === 'mixed');
  await play({ error: 'The AI detector is not available: its detection service is not configured.' }, 503);
  check('ai-detector: service not configured -> the route message, no verdict', /not available/.test(await page.locator('p.text-red-400').first().textContent().catch(() => '')) && await page.locator('[data-verdict]').count() === 0);
  let called = 0; await page.unroute('**/api/ai-detect'); await page.route('**/api/ai-detect', (route) => { called++; route.abort(); });
  await page.getByPlaceholder('Paste text to analyze...').fill('Too short to judge.');
  await page.getByRole('button', { name: 'Detect AI Content' }).click();
  check('ai-detector: under 40 words, no verdict and a clear message', /at least 40 words/.test(await page.locator('p.text-red-400').first().textContent().catch(() => '')));
  await page.getByPlaceholder('Paste text to analyze...').fill('word '.repeat(1001));
  await page.getByRole('button', { name: 'Detect AI Content' }).click();
  check('ai-detector: over 1,000 words, refused before any call, limit declared under the box', /Up to 1000 words/.test(await page.locator('p.text-red-400').first().textContent().catch(() => '')) && called === 0 && /40 to 1000 words/.test(await page.locator('text=words per analysis').first().textContent()));
});

console.log(`\n${name}: ${passes} passed, ${fails} failed`);
if (errors.length) console.log('page errors:', errors.join('\n'));
await b.close();
process.exit(fails ? 1 : 0);
