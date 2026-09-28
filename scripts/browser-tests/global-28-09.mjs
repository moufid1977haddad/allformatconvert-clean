// Checks for the fixes of 28/09 (docs/audit/RAPPORT-global-28-09.md), on a real page as a visitor:
//  slogan   -- the homepage headline and its tool count;
//  grammar  -- the honest notice for Russian, Chinese, Japanese, Hindi and Turkish (and none for English, French);
//  ncm      -- an encrypted .ncm music file on each of the 12 audio tools: a clear message, nothing sent, nothing reported;
//  silence  -- a browser driven by a test robot never reports to tool_errors (a real render crash provoked), and the
//              report route itself writes nothing outside production / for a marked robot (X-Tool-Error-Recorded);
//  chunk    -- a code file of the page that can no longer be loaded (as after a deployment): one automatic reload,
//              then a "Reload" banner, and no tool_errors report;
//  names    -- (preview only, Gotenberg, free) Excel -> PDF with French, Arabic and Chinese file names: the PDF comes
//              back under its own name (the "Cannot convert argument to a ByteString" failure of 26/09).
// Usage: node scripts/browser-tests/global-28-09.mjs <origin> [--browser=firefox|webkit] [--only=slogan,ncm] [--names]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const want = (n) => (!only.length || only.includes(n)) && (n !== 'names' || process.argv.includes('--names'));
const isWww = /onlineconvertools\.com$/.test(new URL(origin).hostname);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g2809-'));
const browser = await { chromium, firefox, webkit }[browserName].launch();
const newCtx = () => browser.newContext({ acceptDownloads: true });

try {
  if (want('slogan')) {
    const ctx = await newCtx(); const p = await ctx.newPage();
    await p.goto(origin + '/', { waitUntil: 'networkidle' });
    const h1 = (await p.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
    const count = await (await fetch(origin + '/api/tool-counts')).json().then((j) => j.total).catch(() => null);
    check('slogan: "<N> free tools. Most never upload your file." with N = the live tool count', h1 === `${count} free tools. Most never upload your file.` && count === 225, `h1 "${h1}", count ${count}`);
    const grad = await p.locator('h1 span').first().evaluate((e) => getComputedStyle(e).backgroundImage);
    check('slogan: second line keeps the gradient of the old "Instantly. Free."', /gradient/.test(grad), grad.slice(0, 60));
    await ctx.close();
  }

  if (want('grammar')) {
    const ctx = await newCtx(); const p = await ctx.newPage();
    await p.goto(origin + '/tools/ai-tools/grammar-fixer', { waitUntil: 'networkidle' });
    const ta = p.getByLabel('Text to fix');
    const samples = { Russian: 'Я хочу пойти в магазин вчера.', Chinese: '我昨天去了商店买东西。', Japanese: '私は昨日お店に行きます。', Hindi: 'मैं कल बाजार जाता हूँ।', Turkish: 'Dün okula gidiyorum ve ödevimi yapıyorum.', English: 'She dont like it.', French: 'Je suis allé au magasin hier.' };
    for (const [lang, text] of Object.entries(samples)) {
      await ta.fill(text);
      const note = p.locator('[data-weak-language]');
      const shown = (await note.count()) ? await note.getAttribute('data-weak-language') : null;
      const expected = ['English', 'French'].includes(lang) ? null : lang;
      check(`grammar: ${lang} text -> ${expected ? 'notice "' + expected + '"' : 'no notice'}`, shown === expected, `shown: ${shown}`);
    }
    const faq = await p.locator('body').innerText();
    check('grammar: the FAQ names the five languages', /Russian, Chinese, Japanese, Hindi and Turkish/.test(faq));
    await ctx.close();
  }

  if (want('ncm')) {
    // An .ncm file starts with "CTENFDAM"; content is irrelevant, it must never be sent or decoded.
    const ncm = path.join(tmp, 'song.ncm');
    fs.writeFileSync(ncm, Buffer.concat([Buffer.from('CTENFDAM'), Buffer.alloc(4096, 7)]));
    const tools = ['ai-tools/audio-transcriber', 'audio-tools/audio-booster', 'audio-tools/audio-compressor', 'audio-tools/audio-converter', 'audio-tools/audio-equalizer', 'audio-tools/audio-merger', 'audio-tools/audio-metadata', 'audio-tools/audio-splitter', 'audio-tools/audio-to-text', 'audio-tools/audio-trimmer', 'audio-tools/audio-waveform', 'video-tools/media-player'];
    for (const t of tools) {
      const ctx = await newCtx(); const p = await ctx.newPage();
      // Any upload to our site or our services (analytics beacons are not the file).
      // By HOST: an analytics beacon carries the page address in its query string, it is not an upload.
      const ours = (u) => { const h = new URL(u).hostname; return u.startsWith(origin) || /railway\.app$/.test(h) || /(^|\.)onlineconvertools\.com$/.test(h); };
      const posts = []; p.on('request', (r) => { if (r.method() !== 'GET' && ours(r.url())) posts.push(r.url()); });
      await p.goto(`${origin}/tools/${t}`, { waitUntil: 'networkidle' });
      if (t.endsWith('audio-to-text')) await p.getByRole('button', { name: /Upload Audio File/ }).click();
      await p.locator('input[type=file]').first().setInputFiles(ncm);
      const msg = p.locator('text=/encrypted download from NetEase Cloud Music/').first();
      const ok = await msg.waitFor({ timeout: 10000 }).then(() => true, () => false);
      await p.waitForTimeout(800);
      check(`ncm: ${t} explains the encrypted file, sends nothing`, ok && !posts.length, ok ? (posts.length ? 'requests: ' + posts.join(' ') : '') : 'no message: ' + (await p.locator('[role=alert], .text-red-400, .text-red-500, .text-red-600').allInnerTexts()).join(' | ').slice(0, 200));
      await ctx.close();
    }
  }

  if (want('silence')) {
    // A real render crash (the one of test 7): the site's error screen shows, and NOTHING goes to /api/report-error.
    const ctx = await newCtx();
    await ctx.addInitScript(() => { try { localStorage.setItem('sticky-notes', JSON.stringify([{ id: 1, text: { note: 'x' }, color: 'bg-yellow-300' }])); } catch {} });
    const p = await ctx.newPage();
    const reports = []; p.on('request', (r) => { if (r.url().includes('/api/report-error')) reports.push(r.url()); });
    await p.goto(`${origin}/tools/text-tools/sticky-notes`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(3000);
    const h1 = await p.locator('h1').allInnerTexts();
    const marked = (await ctx.cookies()).some((c) => c.name === 'oct_automation' && c.value === '1');
    check('silence: a crash in a robot-driven browser shows the error screen and sends no report', h1.includes('Something went wrong') && reports.length === 0, `h1 ${JSON.stringify(h1)}, reports ${reports.length}`);
    check('silence: the robot-driven browser is marked (cookie oct_automation=1)', marked);
    await ctx.close();
    // The route: nothing written outside production, nor for a marked robot. On www only the marked request is
    // sent (an unmarked one would write a real row).
    const body = JSON.stringify({ tool: 'sticky-notes', source: 'browser', ext: null, detectedExt: null, sizeBucket: null, errorType: 'Error', errorMessage: 'global-28-09 test', browser: 'Chrome 151' });
    const marks = isWww ? [true] : [false, true];
    for (const mark of marks) {
      const r = await fetch(origin + '/api/report-error', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(mark ? { Cookie: 'oct_automation=1' } : {}) }, body });
      check(`silence: POST /api/report-error ${mark ? 'from a marked robot' : 'unmarked'} on ${isWww ? 'www' : 'this non-production server'} writes nothing`, r.status === 204 && r.headers.get('x-tool-error-recorded') === 'no', `status ${r.status}, X-Tool-Error-Recorded ${r.headers.get('x-tool-error-recorded')}`);
    }
  }

  if (want('chunk')) {
    // The page is loaded; then its not-yet-loaded code files disappear (a new deployment replaced them).
    const ctx = await newCtx(); const p = await ctx.newPage();
    const reports = []; p.on('request', (r) => { if (r.url().includes('/api/report-error')) reports.push(r.url()); });
    let navigations = 0; p.on('load', () => { navigations++; });
    await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'networkidle' });
    const loaded = new Set(); // everything already fetched stays available
    await ctx.route('**/_next/static/**', (r) => (loaded.has(r.request().url()) ? r.continue() : r.fulfill({ status: 404, body: 'gone' })));
    const perf = await p.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
    perf.forEach((u) => loaded.add(u));
    const navBefore = navigations;
    const pdf = path.join(tmp, 'a.pdf'); fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    await p.locator('input[type=file]').first().setInputFiles(pdf);
    await p.getByRole('button', { name: 'Run OCR' }).click();
    await p.waitForTimeout(6000);
    const reloaded = navigations > navBefore;
    // After the automatic reload the files are still gone: the next failure shows the banner instead of looping.
    if (reloaded) {
      await p.waitForLoadState('domcontentloaded');
      await p.locator('input[type=file]').first().setInputFiles(pdf).catch(() => {});
      await p.getByRole('button', { name: 'Run OCR' }).click().catch(() => {});
      await p.waitForTimeout(6000);
    }
    const banner = await p.locator('[data-new-version]').count();
    check('chunk: a missing code file reloads the page once, then offers "Reload" (no loop)', reloaded && banner === 1 && navigations - navBefore === 1, `reloads ${navigations - navBefore}, banner ${banner}`);
    check('chunk: nothing reported to tool_errors', reports.length === 0, `${reports.length} report(s)`);
    await ctx.close();
  }

  if (want('names')) {
    if (isWww) throw new Error('--names runs on a preview only');
    const src = path.resolve('docs/audit/fixtures-fidelite/fidelite-03.xlsx');
    for (const name of ['Rapport d’été — «final» œuvre.xlsx', 'تقرير المبيعات ٢٠٢٦.xlsx', '年度报告（最终版）.xlsx']) {
      const f = path.join(tmp, name); fs.copyFileSync(src, f);
      const ctx = await newCtx(); const p = await ctx.newPage();
      const responses = []; p.on('response', (r) => { if (r.url().includes('/api/convert-to-pdf')) responses.push(r); });
      await p.goto(`${origin}/tools/pdf-tools/excel-to-pdf`, { waitUntil: 'networkidle' });
      await p.locator('input[type=file]').first().setInputFiles(f);
      await p.getByRole('button', { name: 'Convert to PDF' }).click();
      const d = await p.locator('a[data-download]').waitFor({ timeout: 120000 }).then(async () => (await Promise.all([p.waitForEvent('download'), p.locator('a[data-download]').click()]))[0]).catch(() => null);
      const r = responses[0];
      const cd = r ? r.headers()['content-disposition'] || '' : '';
      const star = /filename\*=UTF-8''([^;]+)/.exec(cd);
      const want = name.replace(/\.xlsx$/, '.pdf');
      const buf = d ? fs.readFileSync(await d.path()) : Buffer.alloc(0);
      check(`names: "${name}" -> a PDF under its own name`, r && r.status() === 200 && buf.subarray(0, 5).toString() === '%PDF-' && star && decodeURIComponent(star[1]) === want, `status ${r ? r.status() : '-'}, header ${cd.slice(0, 120)}, download "${d ? d.suggestedFilename() : '(none)'}"`);
      await ctx.close();
    }
  }
} finally { await browser.close(); }
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${browserName})`);
process.exit(fails ? 1 : 0);
