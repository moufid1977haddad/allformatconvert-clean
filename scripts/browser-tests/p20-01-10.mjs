// P20 (01/10): the pages say exactly what the tools do.
//   1. Whitespace Remover: every button does what its label says; "Remove All Extra" keeps every line of text.
//   2. Merge PDF: the files can be put in order by dragging a row (mouse) and with the ↑ ↓ arrows; the merged PDF
//      follows the order shown.
//   3. "Click or drop … here": a file dropped on an upload area is taken (image tool, PDF tool, video service tool),
//      a file of the wrong type is refused with a message, and the browser never navigates away to the file.
//   4. Home page: no "No data stored" / "Always free"; "13 Languages via Google Translate"; the language menu says
//      the translation is Google's.
//   5. Audio to Text no longer says microphone dictation is local.
// Usage: node scripts/browser-tests/p20-01-10.mjs <origin> [--browser=chromium|firefox|webkit] [--device=iphone|ipad]
//        [--no-vercel-toolbar] [--only=whitespace,merge,drop,home,dictation]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument } from '@cantoo/pdf-lib';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const device = (process.argv.find((a) => a.startsWith('--device=')) || '').slice(9);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const run = (k) => !only.length || only.includes(k);
const tag = `${name}${device ? ` [${device}]` : ''}`;
let fails = 0, passes = 0;
const check = (label, ok, detail = '') => { if (ok) passes++; else fails++; console.log(`${ok ? 'PASS' : 'FAIL'} [${tag}] ${label}${ok || !detail ? '' : `\n    ${detail}`}`); };

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
};
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device ? { userAgent: UA[device], hasTouch: true, viewport: device === 'iphone' ? { width: 390, height: 844 } : { width: 820, height: 1180 } } : { viewport: { width: 1400, height: 900 } }) });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
if (device) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5, configurable: true }); });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${String(e)} [on ${new URL(page.url()).pathname}]`));
const open = async (path) => { await page.goto(origin + path, { waitUntil: 'networkidle' }); };

// ---- 1. Whitespace Remover -----------------------------------------------------------------------------------------
if (run('whitespace')) {
  await open('/tools/text-tools/whitespace-remover');
  const input = '  Roses   are\tred,  \n\n\n   Violets  are blue.\n\n  Sugar is   sweet  \n\n';
  await page.locator('textarea').first().fill(input);
  const result = async (button) => {
    await page.getByRole('button', { name: button, exact: true }).click();
    return page.getByLabel('Result').inputValue();
  };
  const all = await result('Remove All Extra');
  check('Remove All Extra keeps every line of text, one blank line between paragraphs', all === 'Roses are red,\n\nViolets are blue.\n\nSugar is sweet', JSON.stringify(all));
  const extra = await result('Remove Extra Spaces');
  check('Remove Extra Spaces keeps every line, blank lines included', extra === 'Roses are red,\n\n\nViolets are blue.\n\nSugar is sweet\n\n', JSON.stringify(extra));
  const lead = await result('Remove Leading');
  check('Remove Leading trims only the start of each line', lead === 'Roses   are\tred,  \n\n\nViolets  are blue.\n\nSugar is   sweet  \n\n', JSON.stringify(lead));
  const trail = await result('Remove Trailing');
  check('Remove Trailing trims only the end of each line', trail === '  Roses   are\tred,\n\n\n   Violets  are blue.\n\n  Sugar is   sweet\n\n', JSON.stringify(trail));
  const one = await result('Join Into One Line');
  check('Join Into One Line puts everything on one line', one === 'Roses are red, Violets are blue. Sugar is sweet', JSON.stringify(one));
}

// ---- 2. Merge PDF: drag and arrows -------------------------------------------------------------------------------------
async function pdfOfWidth(w) {
  const d = await PDFDocument.create();
  d.addPage([w, 200]);
  return Buffer.from(await d.save());
}
if (run('merge')) {
  await open('/tools/pdf-tools/pdf-merge');
  const files = [];
  for (const [n, w] of [['a.pdf', 100], ['b.pdf', 200], ['c.pdf', 300]]) files.push({ name: n, mimeType: 'application/pdf', buffer: await pdfOfWidth(w) });
  await page.locator('input[type="file"]').setInputFiles(files);
  const order = async () => (await page.locator('[data-merge-row]').allInnerTexts()).map((t) => (t.match(/\b([abc])\.pdf/) || [])[1]).join('');
  check('three files listed in the order chosen', (await order()) === 'abc', await order());
  if (!device) {
    await page.locator('[data-merge-row]').nth(2).dragTo(page.locator('[data-merge-row]').nth(0));
    check('dragging c.pdf onto the first row puts it first (mouse)', (await order()) === 'cab', await order());
  } else {
    // Touch screens reorder with the arrows (the tip says so); simulate the same move.
    await page.getByRole('button', { name: 'Move c.pdf up' }).click();
    await page.getByRole('button', { name: 'Move c.pdf up' }).click();
    check('arrows put c.pdf first (touch)', (await order()) === 'cab', await order());
  }
  await page.getByRole('button', { name: 'Move b.pdf up' }).click();
  check('↑ arrow moves b.pdf above a.pdf', (await order()) === 'cba', await order());
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  const link = page.locator('[data-file-download] a[data-download]');
  await link.waitFor({ timeout: 60000 });
  const bytes = await page.evaluate(async (href) => Array.from(new Uint8Array(await (await fetch(href)).arrayBuffer())), await link.getAttribute('href'));
  const merged = await PDFDocument.load(Uint8Array.from(bytes));
  const widths = merged.getPages().map((p) => Math.round(p.getWidth()));
  check('merged PDF follows the order shown (c, b, a)', widths.join(',') === '300,200,100', widths.join(','));
}

// ---- 3. Drop a file on an upload area -------------------------------------------------------------------------------------
// Playwright cannot drag a file from the desktop; the page receives exactly the events a real drop sends.
async function dropOn(selector, file) {
  await page.waitForFunction(() => window.__fileDropBridge === true, null, { timeout: 15000 });
  return page.evaluate(async ({ selector, file }) => {
    const el = document.querySelector(selector);
    if (!el) return 'no zone';
    let data;
    if (file.canvas) {
      const c = document.createElement('canvas'); c.width = 8; c.height = 8;
      c.getContext('2d').fillRect(0, 0, 8, 8);
      data = await new Promise((res) => c.toBlob(res, file.type));
    } else data = Uint8Array.from(atob(file.b64), (ch) => ch.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([data], file.name, { type: file.type }));
    const opts = { bubbles: true, cancelable: true, dataTransfer: dt };
    el.dispatchEvent(new DragEvent('dragenter', opts));
    const over = new DragEvent('dragover', opts);
    el.dispatchEvent(over);
    const drop = new DragEvent('drop', opts);
    el.dispatchEvent(drop);
    return over.defaultPrevented && drop.defaultPrevented ? 'taken' : 'ignored';
  }, { selector, file });
}
if (run('drop')) {
  // Image tool whose zone says "Click or drop an image here" and had no drop handler before P20.
  await open('/tools/image-tools/jpg-to-png');
  const zone = 'div.border-dashed';
  const urlBefore = page.url();
  const wrong = await dropOn(zone, { name: 'notes.png', type: 'image/png', canvas: true });
  await page.waitForTimeout(300);
  const notice = await page.locator('[data-drop-notice]').textContent().catch(() => '');
  check('JPG to PNG: a PNG dropped is refused with a message naming what it takes', wrong === 'taken' && /doesn't take/.test(notice || '') && /\.jpg/.test(notice || ''), `${wrong} / ${notice}`);
  check('JPG to PNG: nothing loaded after the refused drop', (await page.locator(`${zone} img`).count()) === 0);
  const ok = await dropOn(zone, { name: 'photo.jpg', type: 'image/jpeg', canvas: true });
  await page.locator(`${zone} img`).waitFor({ timeout: 10000 }).catch(() => {});
  check('JPG to PNG: a JPG dropped on the zone is loaded like a picked file', ok === 'taken' && (await page.locator(`${zone} img`).count()) === 1, ok);
  check('JPG to PNG: the browser stayed on the page', page.url() === urlBefore, page.url());
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await page.locator('[data-file-download]').first().waitFor({ timeout: 20000 }).catch(() => {});
  check('JPG to PNG: the dropped file converts', (await page.locator('[data-file-download]').count()) >= 1);

  // PDF tool ("Click or drop a PDF here").
  await open('/tools/pdf-tools/pdf-rotate');
  const pdf = Buffer.from(await pdfOfWidth(150)).toString('base64');
  const r2 = await dropOn('div.border-dashed', { name: 'doc.pdf', type: 'application/pdf', b64: pdf });
  await page.waitForTimeout(800);
  check('PDF Rotate: a PDF dropped is taken (its name shows)', r2 === 'taken' && (await page.getByText('doc.pdf').count()) > 0, r2);

  // Video service tool (shared MediaServiceTool shell): only the file selection, no upload is started.
  await open('/tools/video-tools/video-compressor');
  const r3 = await dropOn('div.border-dashed', { name: 'clip.mp4', type: 'video/mp4', b64: 'AAAAGGZ0eXBtcDQyAAAAAG1wNDJpc29t' });
  await page.waitForTimeout(500);
  check('Video Compressor: a video dropped is selected (name shown, nothing sent yet)', r3 === 'taken' && (await page.getByText(/clip\.mp4/).count()) > 0, r3);

  // A page with its own drop handling is left alone: Hash Generator takes the file once, through its own handler.
  await open('/tools/developer-tools/hash-generator');
  await page.getByRole('radio', { name: 'Files' }).click();
  const zoneSel = await page.evaluate(() => { const p = [...document.querySelectorAll('p')].find((x) => /Drop files here/.test(x.textContent)); if (!p) return null; p.parentElement.setAttribute('data-test-zone', ''); return '[data-test-zone]'; });
  if (zoneSel) {
    const r4 = await dropOn(zoneSel, { name: 'one.txt', type: 'text/plain', b64: 'aGVsbG8=' });
    await page.waitForTimeout(800);
    check('Hash Generator: its own drop handler takes the file, exactly once', r4 === 'taken' && (await page.getByText(/one.txt/).count()) === 1, `${r4} / ${await page.getByText(/one.txt/).count()}`);
  } else check('Hash Generator: drop zone found', false);
}

// ---- 4. Home page wording ---------------------------------------------------------------------------------------
if (run('home')) {
  await open('/');
  const text = await page.locator('body').innerText();
  check('home: no "No data stored"', !/No data stored/i.test(text));
  check('home: no "Always free"', !/Always free/i.test(text));
  check('home: "Most tools run in your browser" and the deletion promise', /Most tools run in your browser/.test(text) && /Files sent to our servers are deleted after processing/.test(text));
  check('home: "Languages via Google Translate"', /Languages via Google Translate/i.test(text));
  if (!device) {
    await page.locator('header button', { hasText: /^EN/ }).first().click();
    check('language menu says "Machine translation by Google"', await page.getByText('Machine translation by Google').first().isVisible());
  }
}

// ---- 5. Audio to Text -----------------------------------------------------------------------------------------------
if (run('dictation')) {
  await open('/tools/audio-tools/audio-to-text');
  const text = await page.locator('body').innerText();
  check('Audio to Text: dictation no longer called local', !/entirely local|isn't uploaded anywhere/i.test(text));
  check("Audio to Text: says the browser sends the recording to its maker's speech service", /speech service/i.test(text) && /Google in Chrome/.test(text));
}

check('no page error', errors.length === 0, errors.join(' | '));
await b.close();
console.log(`${fails ? `${fails} FAILED` : 'ALL PASS'} — ${passes} passed (${tag})`);
process.exit(fails ? 1 : 0);
