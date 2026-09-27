// Product Hunt gallery, regenerated from the LIVE site in one command, just before the launch:
//   node docs/lancement/galerie.mjs [origin=https://www.onlineconvertools.com]
// Output: docs/lancement/galerie/NN-name.png at 1270x760 (Product Hunt's recommended gallery size, read on
// producthunt.com/launch/preparing-for-launch on 28/09/2026) and thumbnail.png at 240x240, each checked < 3 MB.
// Each image = a real screenshot of the tool on www (with a real, free, local action when there is one) under a
// headline that states ONE measured result, with its source report. Every figure below comes from docs/audit/ —
// change a figure only when the report changes (rule n° 20: no promise without the measurement behind it).
// Captions for the Product Hunt form are in docs/lancement/03-textes-en.md.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const origin = new URL(process.argv[2] || 'https://www.onlineconvertools.com').origin;
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const out = path.join(here, 'galerie'); fs.mkdirSync(out, { recursive: true });
const FX = path.resolve(here, '..', 'audit', 'fixtures-safari');
const W = 1270, H = 760, BAND = 170;

const SLIDES = [
  { file: '01-hero', path: '/', title: '225 free online tools — most of them never upload your file', sub: 'PDF, image, audio, video, archives, developer tools. No sign-up. About 200 of the tools run entirely in your browser.', source: 'our privacy audit: 198 local-processing pages cross-checked with every page that calls a server', report: 'claude/plan-de-travail.md (CLOS: audit de confidentialité)' },
  { file: '02-zip-extractor', path: '/tools/file-tools/zip-extractor', title: 'RAR, 7z, ZIP and 40+ archive formats, opened in the browser', sub: 'Same 1.99 GB RAR: first file out in 5.1 s (median of 10) vs 7.25 s at ezyZip; everything extracted to a folder in 9–12 s vs 31–33 s.', source: 'on the live site, same file, Chromium, 26 Sep 2026', report: 'docs/audit/RAPPORT-amelioration-15.md', prep: async (p) => { await p.locator('input[type=file]').first().setInputFiles(path.join(FX, 'safari-winrar.rar')); await p.waitForTimeout(4000); } },
  { file: '03-pdf-compress', path: '/tools/pdf-tools/pdf-compress', title: 'Compress a PDF without changing a single pixel', sub: 'Lossless level: −35.4 % on a 15-page paper, pages identical to the original. iLovePDF “recommended”: −35.0 %, with its images re-compressed.', source: 'same files, every page rendered and compared (PSNR), Sep 2026', report: 'docs/audit/RAPPORT-ecarts-marche.md §3a' },
  { file: '04-image-upscaler', path: '/tools/ai-tools/image-upscaler', title: 'AI upscaling that stays closer to the real photo', sub: 'Perceptual distance to the original (LPIPS, lower is better): 0.107 for us, 0.164 for iLoveIMG, on the same photo.', source: 'same photo, 9 open models and iLoveIMG compared, Sep 2026', report: 'docs/audit/RAPPORT-ecarts-marche.md §3c' },
  { file: '05-grammar-fixer', path: '/tools/ai-tools/grammar-fixer', title: 'Grammar fixes you can see — and undo — word by word', sub: 'On 25 known errors in 12 sentences: 25 fixed (LanguageTool: 15), and an error-free text left untouched.', source: 'same texts, on the live site, 26 Sep 2026', report: 'scripts/browser-tests/grammar-vs-languagetool.mjs, docs/audit/RAPPORT-mise-en-production-26-09.md' },
  { file: '06-hash-generator', path: '/tools/developer-tools/hash-generator', title: '17 hash algorithms, files of any size, nothing uploaded', sub: 'A 760 MiB file hashed with 5 algorithms in 11.7 s — 31.8 s on the reference site. Every result checked against OpenSSL.', source: 'same file, on the live site, Chromium, 24 Sep 2026', report: 'claude/plan-de-travail.md, amélioration 9', prep: async (p) => { const t = p.locator('textarea').first(); if (await t.count()) { await t.fill('Hello Product Hunt'); await p.waitForTimeout(1500); } } },
  { file: '07-barcode-generator', path: '/tools/qr-barcodes-tools/barcode-generator', title: '37 barcode types — every file re-read before you download it', sub: 'Tested on 17 codes: 102 of 102 of our files scanned back correctly; barcode-maker.com: 65 of 68.', source: 'every file decoded by an independent reader (zxing-cpp), Sep 2026', report: 'docs/audit/RAPPORT-amelioration-14.md' },
];

const b = await chromium.launch();
const shot = await b.newContext({ viewport: { width: W, height: H - BAND }, deviceScaleFactor: 1, colorScheme: 'light' });
const frame = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
for (const s of SLIDES) {
  const p = await shot.newPage();
  await p.goto(origin + s.path, { waitUntil: 'networkidle' });
  await p.evaluate(() => { for (const el of document.querySelectorAll('[class*="cookie" i], [id*="cookie" i]')) el.remove(); });
  if (s.prep) await s.prep(p).catch(() => {});
  const png = await p.screenshot({ type: 'png' });
  await p.close();
  const f = await frame.newPage();
  await f.setContent(`<!doctype html><html><head><style>
    *{margin:0;box-sizing:border-box} body{width:${W}px;height:${H}px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background:#0b1b3a;color:#fff;overflow:hidden}
    .band{height:${BAND}px;padding:22px 40px 0 40px} h1{font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-.5px}
    p{font-size:18px;line-height:1.35;margin-top:10px;color:#dbe6ff} small{position:absolute;right:40px;top:${BAND - 26}px;font-size:11px;color:#8fa6d6}
    img{display:block;width:${W}px;height:${H - BAND}px;border-top:3px solid #3b82f6}
  </style></head><body><div class="band"><h1>${esc(s.title)}</h1><p>${esc(s.sub)}</p></div><small>Measured: ${esc(s.source)}</small>
  <img src="data:image/png;base64,${png.toString('base64')}"></body></html>`);
  const file = path.join(out, `${s.file}.png`);
  await f.screenshot({ path: file, type: 'png' });
  await f.close();
  const kb = fs.statSync(file).size / 1024;
  console.log(`${s.file}.png ${W}x${H} ${kb.toFixed(0)} KB${kb > 3000 ? '  ⚠ over 3 MB' : ''}`);
}
{ // thumbnail 240x240: the site's own mark, drawn here
  const f = await b.newPage({ viewport: { width: 240, height: 240 } });
  await f.setContent(`<!doctype html><html><body style="margin:0;width:240px;height:240px;display:flex;align-items:center;justify-content:center;background:#2563eb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#fff"><div style="text-align:center;font-weight:800;font-size:34px;line-height:1.05">Online<br>Conver<br>Tools</div></body></html>`);
  await f.screenshot({ path: path.join(out, 'thumbnail.png') });
  console.log('thumbnail.png 240x240');
}
await b.close();
