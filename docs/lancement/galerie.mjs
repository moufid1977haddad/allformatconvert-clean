// Product Hunt gallery, regenerated in one command from a LOCAL production build of the branch to be launched
// (npm run build && npx next start -p 3100), or from www once that branch is deployed:
//   node docs/lancement/galerie.mjs <origin, e.g. http://localhost:3100>
// Output: docs/lancement/galerie/NN-name.png at 1270x760 (Product Hunt's recommended gallery size, re-read on
// producthunt.com/launch/preparing-for-launch and help.producthunt.com on 29/09/2026) and thumbnail.png at 240x240,
// each checked < 3 MB (Product Hunt's limit for any image).
// Each image = a real screenshot of the tool (with a real, free, local action when there is one) under a headline
// that states ONE measured result. Two kinds of figures only:
//   - MEASURED DURING THE CAPTURE (tool count read from /api/tool-counts, the network requests sent while a photo
//     is compressed): the script prints them and refuses to write a claim the measurement does not support;
//   - taken from a report in docs/audit/ (named in `report`): change the figure only when the report changes
//     (rule n° 20: no promise without the measurement behind it).
// Captions for the Product Hunt form and the proposed order are in docs/lancement/product-hunt.md.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const arg = process.argv[2];
if (!arg) { console.error('usage: node docs/lancement/galerie.mjs <origin>  (e.g. http://localhost:3100)'); process.exit(1); }
const origin = new URL(arg).origin;
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const out = path.join(here, 'galerie'); fs.mkdirSync(out, { recursive: true });
const FX = path.resolve(here, '..', 'audit', 'fixtures-safari');
const PHOTO = path.join(FX, 'safari-small-800x600.jpg'); // made for the Safari sheet: no third-party photo in a public gallery
const W = 1270, H = 760, BAND = 170;

// ---- measured now ---------------------------------------------------------------------------------------------
const counts = await (await fetch(`${origin}/api/tool-counts`)).json();
const total = counts.total;
if (!Number.isInteger(total) || total < 100) throw new Error(`tool count not readable: ${JSON.stringify(counts)}`);
const LABEL = { 'developer-tools': 'Developer', 'pdf-tools': 'PDF', 'image-tools': 'Image', 'text-tools': 'Text', 'ai-tools': 'AI', 'video-tools': 'Video', 'audio-tools': 'Audio', 'gif-tools': 'GIF', 'file-tools': 'Files & archives', 'math-tools': 'Math', 'converter-tools': 'Converters', 'qr-barcodes-tools': 'QR & barcodes' };
const byCat = Object.entries(counts.counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${LABEL[k] || k} ${n}`).join(' · ');
console.log(`tool count read from ${origin}/api/tool-counts: ${total} (${byCat})`);
let privacy = null; // filled by the image-compressor slide

const SLIDES = [
  { file: '01-hero', path: '/', title: () => `${total} free tools. Most never upload your file.`,
    sub: () => `PDF, image, audio, video, archives, developer tools — no sign-up. About 180 of the ${total} run entirely in your browser.`,
    source: () => `${total} = live tool counter; about 180 = recount in the code on 28/09 (44 tools use a server in at least one case)`, report: 'docs/audit/RAPPORT-global-28-09.md, point 3' },
  { file: '02-never-upload', path: '/tools/image-tools/image-compressor',
    title: () => 'Your image never leaves your device',
    sub: () => `While this ${privacy.photoKb} KB image was compressed, the page sent ${privacy.withBody === 0 ? 'no data to any server — no upload request at all' : `${privacy.withBody} small requests, none holding the image`}. Check it yourself in your browser's Network tab.`,
    source: () => 'network requests recorded during this very capture', report: 'measured by this script',
    prep: async (p) => {
      await p.locator('input[type=file]').first().setInputFiles(PHOTO);
      await p.getByRole('button', { name: /^Compress/ }).first().waitFor();
      const sent = [];
      const onReq = (r) => { const b = r.postDataBuffer(); if (r.method() !== 'GET' && r.method() !== 'HEAD') sent.push({ url: r.url(), method: r.method(), bytes: b ? b.length : 0 }); };
      p.on('request', onReq);
      await p.getByRole('button', { name: /^Compress/ }).first().click();
      await p.getByText(/Download/).first().waitFor({ timeout: 60000 });
      await p.waitForTimeout(1500);
      p.off('request', onReq);
      const photoBytes = fs.statSync(PHOTO).size;
      privacy = { photoKb: Math.round(photoBytes / 1024), withBody: sent.length, bytes: sent.reduce((s, x) => s + x.bytes, 0) };
      console.log(`privacy slide: ${sent.length} request(s) with a method other than GET/HEAD during the compression, ${privacy.bytes} bytes in total`, sent);
      // The headline says "0 bytes of the photo": refuse to write it if anything sent could hold the photo.
      if (sent.some((x) => x.bytes >= 512)) throw new Error('a request during the compression carried a body: the privacy headline would be false');
    } },
  { file: '03-all-tools', path: '/tools', title: () => `${total} tools in 12 categories — free, no sign-up`,
    sub: () => byCat, source: () => 'counts read from the live tool counter during this capture (the build fails if a hard-coded count disagrees)', report: 'scripts/check-tool-links.js' },
  { file: '04-zip-extractor', path: '/tools/file-tools/zip-extractor', title: () => 'RAR, 7z, ZIP and 40+ archive formats, opened in the browser',
    sub: () => 'Same 1.99 GB RAR: first file out in 5.1 s (median of 10) vs 7.25 s at ezyZip; everything extracted to a folder in 9–12 s vs 31–33 s.',
    source: () => 'on the live site, same file, Chromium, 26 Sep 2026', report: 'docs/audit/RAPPORT-amelioration-15.md',
    prep: async (p) => { await p.locator('input[type=file]').first().setInputFiles(path.join(FX, 'safari-winrar.rar')); await p.waitForTimeout(4000); } },
  { file: '05-pdf-compress', path: '/tools/pdf-tools/pdf-compress', title: () => 'Compress a PDF without changing a single pixel',
    sub: () => 'Lossless level: −35.4 % on a 15-page paper, pages identical to the original. iLovePDF “recommended”: −35.0 %, with its images re-compressed.',
    source: () => 'same files, every page rendered and compared (PSNR), Sep 2026', report: 'docs/audit/RAPPORT-ecarts-marche.md §3a' },
  { file: '06-image-upscaler', path: '/tools/ai-tools/image-upscaler', title: () => 'AI upscaling that stays closer to the real photo',
    sub: () => 'Perceptual distance to the original (LPIPS, lower is better): 0.107 for us, 0.164 for iLoveIMG, on the same photo. Up to 6 megapixels in.',
    source: () => 'same photo, 9 open models and iLoveIMG compared, Sep 2026', report: 'docs/audit/RAPPORT-ecarts-marche.md §3c; 6 Mpx: RAPPORT-global-28-09.md point 6' },
  { file: '07-hash-generator', path: '/tools/developer-tools/hash-generator', title: () => '17 hash algorithms, files of any size, nothing uploaded',
    sub: () => 'A 760 MiB file hashed with 5 algorithms in 11.7 s — 31.8 s on the reference site. Every result checked against OpenSSL.',
    source: () => 'same file, on the live site, Chromium, 24 Sep 2026', report: 'docs/audit/RAPPORT-ecarts-marche.md',
    prep: async (p) => { const t = p.locator('textarea').first(); if (await t.count()) { await t.fill('Hello Product Hunt'); await p.waitForTimeout(1500); } } },
  { file: '08-barcode-generator', path: '/tools/qr-barcodes-tools/barcode-generator', title: () => '37 barcode types — every file re-read before you download it',
    sub: () => 'Tested on 17 codes: 102 of 102 of our files scanned back correctly; barcode-maker.com: 65 of 68.',
    source: () => 'every file decoded by an independent reader (zxing-cpp), Sep 2026', report: 'docs/audit/RAPPORT-amelioration-14.md' },
];

for (const f of fs.readdirSync(out)) if (/^\d\d-.*\.png$/.test(f)) fs.unlinkSync(path.join(out, f)); // no stale image from an older order
const b = await chromium.launch();
const shot = await b.newContext({ viewport: { width: W, height: H - BAND }, deviceScaleFactor: 1, colorScheme: 'light' });
await shot.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const frame = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
for (const s of SLIDES) {
  const p = await shot.newPage();
  p.setDefaultTimeout(60000);
  await p.goto(origin + s.path, { waitUntil: 'networkidle' });
  await p.evaluate(() => { for (const el of document.querySelectorAll('[class*="cookie" i], [id*="cookie" i]')) el.remove(); });
  if (s.prep) await s.prep(p); // a failed action fails the gallery: no image may show a result that did not happen
  const png = await p.screenshot({ type: 'png' });
  await p.close();
  const f = await frame.newPage();
  await f.setContent(`<!doctype html><html><head><style>
    *{margin:0;box-sizing:border-box} body{width:${W}px;height:${H}px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background:#0b1b3a;color:#fff;overflow:hidden}
    .band{height:${BAND}px;padding:22px 40px 0 40px} h1{font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-.5px}
    p{font-size:18px;line-height:1.35;margin-top:10px;color:#dbe6ff} small{position:absolute;right:40px;top:${BAND - 26}px;font-size:11px;color:#8fa6d6}
    img{display:block;width:${W}px;height:${H - BAND}px;border-top:3px solid #3b82f6}
  </style></head><body><div class="band"><h1>${esc(s.title())}</h1><p>${esc(s.sub())}</p></div><small>Measured: ${esc(s.source())}</small>
  <img src="data:image/png;base64,${png.toString('base64')}"></body></html>`);
  const file = path.join(out, `${s.file}.png`);
  await f.screenshot({ path: file, type: 'png' });
  await f.close();
  const kb = fs.statSync(file).size / 1024;
  console.log(`${s.file}.png ${W}x${H} ${kb.toFixed(0)} KB${kb > 3000 ? '  ⚠ over 3 MB' : ''}  [${s.report}]`);
}
{ // thumbnail 240x240: the site's own mark, drawn here
  const f = await b.newPage({ viewport: { width: 240, height: 240 } });
  await f.setContent(`<!doctype html><html><body style="margin:0;width:240px;height:240px;display:flex;align-items:center;justify-content:center;background:#2563eb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#fff"><div style="text-align:center;font-weight:800;font-size:34px;line-height:1.05">Online<br>Conver<br>Tools</div></body></html>`);
  await f.screenshot({ path: path.join(out, 'thumbnail.png') });
  console.log('thumbnail.png 240x240');
}
await b.close();
