// P31 (03/10): the Download button saves the file under its full name with the exact bytes, for PDF, JPG, PNG, M4R,
// MP3, MP4, ZIP and DOCX, in Chromium, Firefox and WebKit (and as an iPhone: user agent + touch).
// On the owner's iPhone (iOS 26) PDFs opened full screen and an M4R arrived as "memo-vocal.m4r.html". Each case runs
// a real tool, then checks: the link is a blob: of the file retyped application/octet-stream with download="<name>",
// the browser's download has that exact name and the same bytes as the row, the bytes are really the format, and
// no request went to /zipdl/ (the old service-worker address). Run against a local production build only.
// Usage: node scripts/p31/download-names.mjs <origin> [--browser=chromium|firefox|webkit] [--device=iphone] [--only=pdf,m4r]
//        P31_KIT=<folder with kit-iphone-p19 and kit-iphone-p21 unzipped> (default: <tmp>/p31-kit)
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const device = (process.argv.find((a) => a.startsWith('--device=')) || '').slice(9);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const tag = `${engine}${device ? ` [${device}]` : ''}`;
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };

const KIT = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p31-dl-'));
const JPG = 'docs/audit/fixtures-safari/safari-small-800x600.jpg';
const PNG = 'scripts/audit/fixtures/files/sample.png';
const GIF = 'scripts/audit/fixtures/files/sample.gif';
const M4A = path.join(KIT, 'kit-iphone-p19', 'memo-vocal.m4a');
const DOCX = path.join(KIT, 'kit-iphone-p21', 'fidelite-01.docx');
// a ZIP holding the DOCX under an accented name (Zip Extractor saves the entry it extracts)
const DOCX_ZIP = path.join(tmp, 'docs.zip');
execFileSync('python', ['-c', "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'w'); z.write(sys.argv[2],'Rapport Élodie.docx'); z.close()", DOCX_ZIP, DOCX]);
const TXT = path.join(tmp, 'notes été.txt'); fs.writeFileSync(TXT, 'Montréal, Élodie 🎉\n');

const at = (b, off, s) => [...s].every((c, i) => b[off + i] === c.charCodeAt(0));
const MAGIC = {
  pdf: (b) => at(b, 0, '%PDF'), jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, png: (b) => b[0] === 0x89 && at(b, 1, 'PNG'),
  m4r: (b) => at(b, 4, 'ftyp'), mp3: (b) => at(b, 0, 'ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0), mp4: (b) => at(b, 4, 'ftyp'),
  zip: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4, docx: (b) => b[0] === 0x50 && b[1] === 0x4b && b.includes(Buffer.from('word/')),
};
const audio = (fmt) => async (p) => { await p.getByRole('combobox', { name: 'Target Format' }).selectOption(fmt); await p.getByRole('button', { name: 'Convert Audio' }).click(); };
const CASES = [
  { kind: 'pdf', slug: 'pdf-tools/jpg-to-pdf', files: [JPG], go: (p) => p.getByRole('button', { name: 'Convert to PDF' }).click(), name: /^safari-small-800x600\.pdf$/ },
  { kind: 'jpg', slug: 'image-tools/png-to-jpg', files: [PNG], go: (p) => p.getByRole('button', { name: 'Convert', exact: true }).click(), name: /^sample\.jpg$/ },
  { kind: 'png', slug: 'image-tools/grayscale-converter', files: [PNG], go: (p) => p.getByRole('button', { name: 'Convert to Grayscale' }).click(), name: /^sample-grayscale\.png$/ },
  { kind: 'm4r', slug: 'audio-tools/audio-converter', files: [M4A], go: audio('m4r'), name: /^memo-vocal\.m4r$/, timeout: 180000 },
  { kind: 'mp3', slug: 'audio-tools/audio-converter', files: [M4A], go: audio('mp3'), name: /^memo-vocal\.mp3$/, timeout: 180000 },
  { kind: 'mp4', slug: 'gif-tools/gif-to-mp4', files: [GIF], go: (p) => p.getByRole('button', { name: 'Convert to MP4' }).click(), name: /\.mp4$/, timeout: 180000 },
  { kind: 'zip', slug: 'file-tools/zip-creator', files: [TXT, PNG], go: (p) => p.getByRole('button', { name: 'Create ZIP' }).click(), name: /\.zip$/ },
  { kind: 'docx', slug: 'file-tools/zip-extractor', files: [DOCX_ZIP], extractor: true, name: /^Rapport Élodie\.docx$/ },
];

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const b = await { chromium, firefox, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, isMobile: engine !== 'firefox', viewport: { width: 390, height: 844 } } : {}) });
await ctx.addInitScript(() => { navigator.share = async () => {}; navigator.canShare = () => true; });

for (const c of CASES) {
  if (only.length && !only.includes(c.kind)) continue;
  if (c.files.some((f) => !fs.existsSync(f))) { check(`${c.kind}: fixture present`, false, c.files.join(', ')); continue; }
  const p = await ctx.newPage();
  const zipdl = []; p.on('request', (r) => { if (r.url().includes('/zipdl/')) zipdl.push(r.url()); });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  try {
    await p.goto(`${origin}/tools/${c.slug}`, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1200);
    await p.locator('input[type=file]').first().setInputFiles(c.files);
    await p.waitForTimeout(500);
    let dl, rowName, rowBytes;
    if (c.extractor) {
      const btn = p.locator('[data-entry] [data-download]').first();
      await btn.waitFor({ timeout: 60000 });
      rowName = (await p.locator('[data-entry]').first().getAttribute('data-entry')).split('/').pop();
      [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), btn.click({ noWaitAfter: true })]);
      rowBytes = fs.readFileSync(DOCX); // the entry stored in the ZIP
    } else {
      await c.go(p);
      const row = p.locator('[data-file-download]').first();
      await row.waitFor({ timeout: c.timeout || 60000 });
      const link = row.locator('a[data-download]');
      await p.waitForFunction((el) => el.dataset.retyped === '1', await link.elementHandle(), { timeout: 10000 });
      const info = await link.evaluate(async (a) => {
        const blob = await (await fetch(a.href)).blob();
        return { href: a.getAttribute('href'), download: a.getAttribute('download'), type: blob.type, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), row: a.closest('[data-file-download]').dataset.name };
      });
      rowName = info.row; rowBytes = Buffer.from(info.bytes);
      check(`${c.kind}: link = blob: retyped application/octet-stream, download="${info.download}"`, /^blob:/.test(info.href) && info.type === 'application/octet-stream' && info.download === rowName, `${info.href} ${info.type} ${info.download}`);
      // noWaitAfter: Playwright's Firefox waits for a navigation an octet-stream download never finishes (the file is
      // saved all the same: the download event fires, the page stays) — measured 03/10.
      [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), link.click({ noWaitAfter: true })]);
    }
    const got = fs.readFileSync(await dl.path());
    const name = dl.suggestedFilename();
    check(`${c.kind}: saved as "${name}" (expected ${c.name})`, name === rowName && c.name.test(name), `row "${rowName}"`);
    check(`${c.kind}: same bytes as the result (${got.length} B) and a real ${c.kind.toUpperCase()}`, got.equals(rowBytes) && MAGIC[c.kind](got), `first ${got.subarray(0, 12).toString('hex')}`);
    await p.waitForTimeout(500);
    check(`${c.kind}: the page stays on the tool after the download`, p.url() === `${origin}/tools/${c.slug}` && (c.extractor || await p.locator('[data-file-download]').first().isVisible()), p.url());
    check(`${c.kind}: no request to /zipdl/`, zipdl.length === 0, zipdl.join(' '));
    check(`${c.kind}: no page error`, errors.length === 0, errors.join(' | '));
  } catch (e) {
    check(`${c.kind}: downloaded`, false, String(e.message).split('\n')[0].slice(0, 200));
  }
  await p.close().catch(() => {});
}
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL, ${passes} pass (${tag})` : `ALL PASS: ${passes} checks (${tag})`);
process.exit(fails ? 1 : 0);
