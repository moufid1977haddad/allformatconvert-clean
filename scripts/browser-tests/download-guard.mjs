// Permanent download guard (P18, 01/10) — the runtime half of scripts/check-downloads.js (build guard).
// For a sample of tools of every category, run as a visitor: the result must show a VISIBLE "Download" link with the
// file's name, format and size (the site's FileDownload row), and the file behind it must be REAL (non-empty, the
// right format by its first bytes). Several files -> a visible "Download all (N files, ZIP)" that makes a real ZIP.
// Then, in the same engine:
//   --device=iphone : iPhone Safari user agent + touch; --device=ipad : iPadOS desktop-class Safari ("Macintosh" user
//   agent) + 5 touch points — the case of the iPad 9th generation (Split PDF, 29/09). On both: the "Save / Share"
//   button must be there and hand the real file to navigator.share (stubbed: it records the files, real type kept).
// Everywhere (P31, 03/10): "Download" is a blob: link to the file RETYPED application/octet-stream, with the download
//   attribute = the full name, and no request to /zipdl/ (the P21 service-worker address opened PDFs and gave an
//   M4R saved as ".m4r.html" on the real iPhone).
// Also checked: leaving the page with a file not yet downloaded asks first (beforeunload); after "Download" it does not.
// Usage: node scripts/browser-tests/download-guard.mjs <origin> [--browser=chromium|firefox|webkit] [--device=iphone|ipad]
//        [--only=slug,slug] [--no-vercel-toolbar] [--service] (also the tools that use our servers: Markdown to PDF,
//        Video to GIF — only against a preview or www, where those services exist)
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import UPNG from 'upng-js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const device = (process.argv.find((a) => a.startsWith('--device=')) || '').slice(9);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const withService = process.argv.includes('--service');
let fails = 0, passes = 0;
const tag = `${name}${device ? ` [${device}]` : ''}`;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };

// ---- fixtures --------------------------------------------------------------------------------------------------
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'download-guard-'));
const fx = (n, data) => { const p = path.join(dir, n); fs.writeFileSync(p, data); return p; };
async function pdf(pages, n) {
  const d = await PDFDocument.create(); const f = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) d.addPage([400, 500]).drawText(`Page ${i}`, { x: 50, y: 400, size: 30, font: f });
  return fx(n, await d.save());
}
const px = new Uint8Array(64 * 48 * 4); for (let i = 0; i < 64 * 48; i++) px.set([(i * 7) % 255, (i * 3) % 255, 120, 255], i * 4);
const PNG = fx('photo.png', Buffer.from(UPNG.encode([px.buffer], 64, 48, 0)));
const JPG = 'docs/audit/fixtures-safari/safari-small-800x600.jpg';
const PDF3 = await pdf(3, 'report.pdf');
const PDF1 = await pdf(1, 'one.pdf');
const TXT = fx('notes.txt', 'Hello download guard\nSecond line\n');
const MOBI = 'docs/audit/fixtures-safari/safari-book.mobi';
const MAGIC = {
  pdf: (b) => b.subarray(0, 5).toString() === '%PDF-', png: (b) => b[0] === 0x89 && b[1] === 0x50, jpg: (b) => b[0] === 0xff && b[1] === 0xd8,
  gif: (b) => b.subarray(0, 3).toString() === 'GIF', zip: (b) => b[0] === 0x50 && b[1] === 0x4b, epub: (b) => b[0] === 0x50 && b[1] === 0x4b && b.includes(Buffer.from('application/epub+zip')),
  text: (b) => b.length > 0 && !b.includes(0), any: (b) => b.length > 0, svg: (b) => b.toString('utf8').includes('<svg'),
};

const NO_OFFSCREEN = "Playwright's WebKit on Windows has no OffscreenCanvas: this tool cannot run in it (real Safari has it)";
// slug, input files, actions before the result, expected files [nameRegex, magic], min files
const TOOLS = [
  { slug: 'pdf-tools/pdf-split', files: [PDF3], go: async (p) => { await p.locator('#split-spec').fill('1-3'); await p.getByRole('button', { name: 'Split PDF', exact: true }).click(); }, expect: [[/\.pdf$/, 'pdf']] }, // the iPad case: "Done! 1 PDF"
  { slug: 'pdf-tools/pdf-split', label: 'pdf-split (every page -> ZIP)', files: [PDF3], go: async (p) => { await p.getByRole('radio', { name: 'Every page', exact: true }).click(); await p.getByRole('button', { name: 'Split PDF', exact: true }).click(); }, expect: [[/\.pdf$/, 'pdf']], zip: true },
  { slug: 'pdf-tools/pdf-merge', files: [PDF3, PDF1], go: (p) => p.getByRole('button', { name: 'Merge PDFs' }).click(), expect: [[/\.pdf$/, 'pdf']] },
  { slug: 'pdf-tools/pdf-rotate', files: [PDF3], go: (p) => p.getByRole('button', { name: 'Rotate PDF' }).click(), expect: [[/\.pdf$/, 'pdf']] },
  { slug: 'pdf-tools/pdf-watermark', files: [PDF3], go: async (p) => { await p.getByPlaceholder('CONFIDENTIAL').fill('DRAFT'); await p.getByRole('button', { name: 'Add Watermark' }).click(); }, expect: [[/\.pdf$/, 'pdf']] },
  { slug: 'pdf-tools/jpg-to-pdf', files: [JPG], go: (p) => p.getByRole('button', { name: 'Convert to PDF' }).click(), expect: [[/\.pdf$/, 'pdf']] },
  { slug: 'pdf-tools/pdf-to-jpg', files: [PDF3], go: (p) => p.getByRole('button', { name: 'Convert pages' }).click(), expect: [[/\.jpe?g$/, 'jpg']], zip: true }, // P21: two modes since 02/10
  { slug: 'pdf-tools/text-to-pdf', files: null, go: async (p) => { await p.getByRole('button', { name: 'Paste Text' }).click(); await p.getByPlaceholder('Paste your text here...').fill('Hello PDF'); await p.getByRole('button', { name: 'Convert to PDF' }).click(); }, expect: [[/\.pdf$/, 'pdf']] },
  { slug: 'image-tools/png-to-jpg', files: [PNG], go: (p) => p.getByRole('button', { name: 'Convert', exact: true }).click(), expect: [[/\.jpe?g$/, 'jpg']] },
  { slug: 'image-tools/image-resizer', files: [JPG], go: (p) => p.getByRole('button', { name: 'Resize', exact: true }).click(), expect: [[/\.(jpe?g|png)$/, 'any']] },
  { slug: 'image-tools/image-rotate', files: [JPG], go: (p) => p.getByRole('button', { name: 'Rotate', exact: true }).click(), expect: [[/\.(jpe?g|png)$/, 'any']] },
  { slug: 'image-tools/grayscale-converter', files: [PNG], go: (p) => p.getByRole('button', { name: 'Convert to Grayscale' }).click(), expect: [[/\.png$/, 'png']] },
  { slug: 'image-tools/image-compressor', files: [JPG, PNG], go: async (p) => { await p.getByRole('button', { name: /^Compress/ }).click(); await p.getByRole('button', { name: /^Compress 2 images/ }).waitFor({ timeout: 60000 }); /* both images done: the JPG row appears first, the PNG one later (P19: under load the bench once took the list too early) */ }, expect: [[/\.(jpe?g|png)$/, 'any']], zip: true, zipOptional: true, webkitSkip: NO_OFFSCREEN },
  { slug: 'image-tools/image-converter', files: [JPG, PNG], go: (p) => p.getByRole('button', { name: /^Convert \d+ file/ }).click(), expect: [[/\.\w+$/, 'any']], zip: true, webkitSkip: NO_OFFSCREEN },
  { slug: 'gif-tools/image-to-gif', files: [PNG, JPG], go: (p) => p.getByRole('button', { name: 'Create GIF' }).click(), expect: [[/\.gif$/, 'gif']] },
  { slug: 'file-tools/zip-creator', files: [TXT, PNG], go: (p) => p.getByRole('button', { name: 'Create ZIP' }).click(), expect: [[/\.zip$/, 'zip']] },
  { slug: 'file-tools/file-splitter', files: [JPG], go: async (p) => { await p.locator('input[type=number]').first().fill('10'); await p.getByRole('combobox', { name: 'Unit' }).selectOption('KB'); await p.getByRole('button', { name: 'Split File' }).click(); }, expect: [[/\.part\d+$/, 'any']], zip: true },
  { slug: 'file-tools/file-encryptor', files: [TXT], go: async (p) => { await p.locator('input[type=password]').fill('test-pass-123'); await p.getByRole('button', { name: 'Encrypt File' }).click(); }, expect: [[/\.encrypted$/, 'any']] },
  { slug: 'developer-tools/json-formatter', files: null, text: true, go: async (p) => { await p.getByPlaceholder('Paste JSON here...').fill('{"a":1,"b":[1,2]}'); await p.getByRole('button', { name: 'Format', exact: true }).click(); }, expect: [[/\.json$/, 'text']] },
  { slug: 'developer-tools/csv-to-tsv', files: null, text: true, go: async (p) => { await p.getByPlaceholder('Paste CSV here...').fill('a,b\n1,2\n'); await p.getByRole('button', { name: 'Convert', exact: true }).click(); }, expect: [[/\.tsv$/, 'text']] },
  { slug: 'qr-barcodes-tools/qr-generator', files: null, text: true, go: async (p) => { await p.locator('[id^="qr-"]').first().fill('https://www.onlineconvertools.com'); await p.getByRole('button', { name: 'Generate QR Code' }).click(); }, expect: [[/\.png$/, 'png'], [/\.svg$/, 'svg'], [/\.pdf$/, 'pdf']], zip: true },
  // P19: PNG / SVG / PDF are three formats of ONE QR code — downloading one of them is enough, leaving then no longer asks
  { slug: 'qr-barcodes-tools/qr-generator', label: 'qr-generator (one of its formats downloaded)', files: null, text: true, alternatives: true, go: async (p) => { await p.locator('[id^="qr-"]').first().fill('https://www.onlineconvertools.com'); await p.getByRole('button', { name: 'Generate QR Code' }).click(); }, expect: [[/\.png$/, 'png']] },
  { slug: 'developer-tools/hash-generator', files: null, text: true, go: async (p) => { await p.getByRole('radio', { name: 'Files' }).click(); await p.locator('input[type=file]').first().setInputFiles([TXT, PNG]); await p.getByRole('button', { name: /^Hash 2 files/ }).click(); }, expect: [[/^checksums\.txt$/, 'text']] },
  // P19: copying a text result counts as taking it (Copy button = navigator.clipboard.writeText)
  { slug: 'developer-tools/json-formatter', label: 'json-formatter (result copied, not downloaded)', files: null, text: true, copy: (p) => p.getByRole('button', { name: 'Copy', exact: true }).click(), go: async (p) => { await p.getByPlaceholder('Paste JSON here...').fill('{"a":1,"b":[1,2]}'); await p.getByRole('button', { name: 'Format', exact: true }).click(); }, expect: [[/\.json$/, 'text']] },
  { slug: 'text-tools/case-converter', files: null, text: true, go: async (p) => { await p.getByPlaceholder('Type or paste your text here...').fill('hello world'); await p.getByRole('button', { name: 'UPPERCASE' }).click(); }, expect: [[/\.txt$/, 'text']] },
  { slug: 'converter-tools/mobi-to-epub', files: [MOBI], go: (p) => p.getByRole('button', { name: 'Convert to EPUB' }).click(), expect: [[/\.epub$/, 'epub']] },
  { slug: 'pdf-tools/markdown-to-pdf', service: true, files: null, go: async (p) => { await p.getByRole('button', { name: 'Paste Text' }).click(); await p.getByRole('textbox', { name: 'Markdown' }).fill('# Title\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n[link](https://example.com)\n\n```js\nconst x = 1;\n```\n'); await p.getByRole('button', { name: 'Convert to PDF' }).click(); }, expect: [[/\.pdf$/, 'pdf']], timeout: 120000 },
];

// ---- browser -------------------------------------------------------------------------------------------------
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15', // iPadOS 13+ presents itself as a Mac
};
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device ? { userAgent: UA[device], hasTouch: true, viewport: device === 'iphone' ? { width: 390, height: 844 } : { width: 820, height: 1180 } } : {}) });
// On a Vercel PREVIEW, Vercel's comment toolbar (vercel.live) throws "navigator.storage.persisted" under WebKit; not the
// site's code (absent on www): --no-vercel-toolbar blocks only it (as all-pages-load.mjs)
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((url) => url.hostname === 'vercel.live', (r) => r.abort());
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
if (device) {
  await ctx.addInitScript(() => {
    // Real iPads report 5 touch points with a "Macintosh" user agent; the share sheet is stubbed to record the files.
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5, configurable: true });
    window.__shared = [];
    navigator.share = async (data) => { window.__shared.push(...(data.files || []).map((f) => ({ name: f.name, size: f.size, type: f.type }))); };
    navigator.canShare = (data) => !!(data && data.files && data.files.length);
  });
}

if (name === 'chromium') await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

// P19: a sample result shown at load (Markdown Editor's example) is not the visitor's file — leaving does not ask,
// even after a click on the page; once they edit it, the result is theirs and leaving asks.
if (!device && (!only.length || only.includes('markdown-editor'))) {
  const p = await ctx.newPage();
  try {
    await p.goto(`${origin}/tools/developer-tools/markdown-editor`, { waitUntil: 'load', timeout: 60000 });
    await p.locator('[data-file-download]').first().waitFor({ timeout: 30000 });
    await p.waitForTimeout(800);
    await p.locator('main h1, h1').first().click(); // a gesture (browsers show "Leave page?" only after one), but no change
    let asked = false;
    p.once('dialog', async (d) => { asked = true; await d.dismiss(); });
    await p.close({ runBeforeUnload: true });
    await new Promise((r) => setTimeout(r, 1500));
    check('markdown-editor: the sample shown at load does not make leaving ask', !asked);
    if (asked) await p.close().catch(() => {});
  } catch (e) { check('markdown-editor: sample page', false, String(e.message).split('\n')[0]); }
  const q = await ctx.newPage();
  try {
    await q.goto(`${origin}/tools/developer-tools/markdown-editor`, { waitUntil: 'load', timeout: 60000 });
    await q.locator('[data-file-download]').first().waitFor({ timeout: 30000 });
    await q.getByRole('textbox', { name: 'Markdown' }).click(); // a real gesture: Firefox asks only after one
    await q.getByRole('textbox', { name: 'Markdown' }).fill('# My notes\n\nWritten by the visitor.');
    await q.waitForTimeout(800);
    let asked = false;
    q.once('dialog', async (d) => { asked = d.type() === 'beforeunload'; await d.dismiss(); });
    await q.close({ runBeforeUnload: true });
    await new Promise((r) => setTimeout(r, 1500));
    check('markdown-editor: after editing, leaving without downloading asks first', asked);
  } catch (e) { check('markdown-editor: edited page', false, String(e.message).split('\n')[0]); }
  await q.close().catch(() => {});
}

async function fileOf(p, row) {
  return p.evaluate(async (el) => {
    const a = el.querySelector('a[data-download]');
    // P31: the link is made retyped as soon as the row has read its file — wait for it (a second at most).
    for (let i = 0; i < 50 && a.dataset.retyped !== '1'; i++) await new Promise((r) => setTimeout(r, 100));
    const res = await fetch(a.href);
    const buf = await res.arrayBuffer();
    const blobType = (await (await fetch(a.href)).blob()).type;
    const vis = (x) => { const r = x.getBoundingClientRect(); const s = getComputedStyle(x); return r.width > 20 && r.height > 12 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.1; };
    return { href: a.getAttribute('href'), downloadAttr: a.getAttribute('download'), blobType, name: el.dataset.name, shownBytes: el.dataset.bytes, text: el.innerText, linkText: a.innerText.trim(), visible: vis(a), bytes: Array.from(new Uint8Array(buf)) };
  }, row);
}

for (const t of TOOLS) {
  const slug = t.slug.split('/')[1];
  if (only.length && !only.includes(slug)) continue;
  if (t.service && !withService) continue;
  if (name === 'webkit' && t.webkitSkip) { console.log(`SKIP ${tag} ${slug}: ${t.webkitSkip}`); continue; }
  if (t.files && t.files.some((f) => !fs.existsSync(f))) { check(`${t.label || slug}: fixture present`, false, t.files.join(', ')); continue; }
  const label = t.label || slug;
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const zipdl = []; p.on('request', (r) => { if (r.url().includes('/zipdl/')) zipdl.push(r.url()); });
  try {
    await p.goto(`${origin}/tools/${t.slug}`, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1500);
    if (t.files) await p.locator('input[type=file]').first().setInputFiles(t.files);
    await p.waitForTimeout(400);
    await t.go(p);
    await p.locator('[data-file-download]').first().waitFor({ timeout: t.timeout || 60000 });
    await p.waitForTimeout(800); // every row of a batch, sizes read
    const rows = await p.locator('[data-file-download]').elementHandles();
    const files = [];
    for (const r of rows) files.push(await fileOf(p, r));
    for (const [re, kind] of t.expect) {
      const f = files.find((x) => re.test(x.name));
      if (!f) { check(`${label}: a file named ${re}`, false, files.map((x) => x.name).join(', ')); continue; }
      const buf = Buffer.from(f.bytes);
      check(`${label}: "${f.name}" — visible "Download" link, name, format and size shown`, f.visible && f.linkText === 'Download' && f.text.includes(f.name) && /\b\d+(\.\d)? (B|KB|MB|GB)\b/.test(f.text), `${f.linkText} | ${f.text.replace(/\s+/g, ' ')}`);
      check(`${label}: "${f.name}" is a real ${kind} file (${buf.length} bytes)`, MAGIC[kind](buf) && String(buf.length) === f.shownBytes, `first bytes ${buf.subarray(0, 8).toString('hex')}, shown ${f.shownBytes}`);
      check(`${label}: "${f.name}" — Download = blob: retyped application/octet-stream, download="${f.name}"`, /^blob:/.test(f.href || '') && f.blobType === 'application/octet-stream' && f.downloadAttr === f.name, `${f.href} ${f.blobType} ${f.downloadAttr}`);
    }
    // A file never downloaded: leaving asks first (desktop engines). One rule for the whole site since P19 (01/10):
    // text results (formatters, checksums) and generators (QR) too — they were exempt until then.
    const guarded = !device;
    if (guarded) {
      let asked = false;
      p.once('dialog', async (d) => { asked = d.type() === 'beforeunload'; await d.dismiss(); });
      await p.close({ runBeforeUnload: true });
      await new Promise((r) => setTimeout(r, 1500)); // Firefox under load shows the dialog later
      check(`${label}: leaving with the file not downloaded asks first`, asked);
    }
    const first = p.locator('[data-file-download]').first();
    let savedAll = false;
    if (t.zip) {
      const all = p.locator('[data-download-all]');
      if (files.length < 2 && t.zipOptional) { /* one kept file only (the other not smaller) */ }
      else if (!(await all.isVisible())) check(`${label}: "Download all (ZIP)" shown for ${files.length} files`, false);
      else if (!device) {
        const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), all.click()]);
        const buf = fs.readFileSync(await dl.path());
        check(`${label}: "Download all" gives a real ZIP of ${files.length} files (${dl.suggestedFilename()})`, MAGIC.zip(buf) && /\.zip$/.test(dl.suggestedFilename()) && buf.length > 100, `${buf.length} bytes`);
        savedAll = true;
      }
    }
    if (device) {
      const share = first.locator('[data-share]');
      check(`${label}: "Save / Share" button on ${device}`, await share.isVisible());
      if (await share.isVisible()) {
        await share.click();
        await p.waitForTimeout(300);
        const shared = await p.evaluate(() => window.__shared);
        const f0 = files[0];
        check(`${label}: Share hands the real file to the share sheet`, shared.length === 1 && shared[0].name === f0.name && shared[0].size === f0.bytes.length, JSON.stringify(shared));
      }
      // P31 (03/10): the tap saves the retyped blob under the full name, without any navigation (/zipdl/).
      zipdl.length = 0;
      const dlp = p.waitForEvent('download', { timeout: 30000 }).catch(() => null);
      await first.locator('a[data-download]').click();
      const dl = await dlp;
      const got = dl ? fs.readFileSync(await dl.path()) : null;
      check(`${label}: Download saved under its full name with the same bytes, no /zipdl/ request`, !!dl && zipdl.length === 0 && dl.suggestedFilename() === files[0].name && got && got.equals(Buffer.from(files[0].bytes)), `${dl ? dl.suggestedFilename() : 'no download'} ${zipdl[0] || ''}`);
    } else if (guarded) {
      // Every file downloaded (the ZIP, or each row's Download) -> leaving no longer asks. Several formats of one
      // result: downloading the first is enough. A text result copied: nothing downloaded at all.
      if (t.copy) {
        await t.copy(p);
      } else if (t.alternatives) {
        const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), first.locator('a[data-download]').click()]);
        await dl.path();
      } else if (!savedAll) {
        for (const a of await p.locator('[data-file-download] a[data-download]').all()) {
          const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), a.click()]);
          await dl.path();
        }
      }
      // The rows' "downloaded" state is set by React after the click: wait until every row says so (under CPU load a
      // fixed delay was once too short on www, 01/10 — the site was right, the bench too quick).
      await p.waitForFunction(() => [...document.querySelectorAll('[data-file-download]')].every((r) => /Downloaded|Copied/.test(r.innerText) || r.dataset.taken === '1'), null, { timeout: 10000 }).catch(() => {});
      await p.waitForTimeout(300);
      let askedAfter = false;
      p.once('dialog', async (d) => { askedAfter = true; await d.accept(); });
      await p.close({ runBeforeUnload: true });
      await new Promise((r) => setTimeout(r, 1500)); // Firefox under load shows the dialog later
      check(`${label}: after ${t.copy ? '"Copy"' : t.alternatives ? 'downloading ONE of its formats' : '"Download"'}, leaving does not ask`, !askedAfter);
    }
    check(`${label}: no page error`, errors.length === 0, errors.join(' | '));
  } catch (e) {
    check(`${label}: result offered for download`, false, String(e.message).split('\n')[0].slice(0, 200));
  }
  await p.close().catch(() => {});
}
await b.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL, ${passes} pass (${tag})` : `ALL PASS: ${passes} checks (${tag})`);
process.exit(fails ? 1 : 0);
