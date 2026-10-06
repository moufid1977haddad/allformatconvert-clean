// P37 lot 1 -- browser proof of the 5 fixes, on a running build of the site (local only: never www or a preview).
//   node scripts/p37/lot1/lot1-browser.pw.mjs <origin> [--browser=chromium|webkit|firefox] [--only=svg,meta,tiff,pdfq,epub]
// Cases:
//   svg  -- SVG to PNG: the preview <img> under the result is a real picture (naturalWidth > 0)
//   meta -- Image Metadata Viewer on a WebP with GPS/EXIF/XMP (written by libvips): GPS group, camera, XMP shown;
//           "Remove metadata" gives a WebP without EXIF/XMP
//   tiff -- TIFF to JPG gives a JPEG (Playwright WebKit on Windows has no OffscreenCanvas: the case of the bug)
//   pdfq -- Image Converter, PDF at "Quality" 20 % is smaller than at 50 % (they were the same file)
//   epub -- EPUB to PDF with a chapter file missing: the HTML sent for printing has no empty chapter, and the page
//           says "1 chapter of this book could not be read". /api/convert-html-to-pdf is answered by this script
//           (no server, no Gotenberg call): the request body is captured and a 1-page PDF is returned.
import { chromium, webkit, firefox } from '@playwright/test';
import sharp from 'sharp';
import JSZip from 'jszip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv[2] || 'http://localhost:3000').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').split('=')[1];
const only = (process.argv.find((a) => a.startsWith('--only=')) || '--only=svg,meta,tiff,pdfq,epub').split('=')[1].split(',');
const engine = { chromium, webkit, firefox }[name];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p37-lot1-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const b = await engine.launch();
async function page(tool) {
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/${tool}`, { waitUntil: 'networkidle' });
  return { ctx, p };
}
async function download(p, link) {
  const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const out = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out); return out;
}
const setRange = (p, label, v) => p.getByLabel(label).evaluate((el, val) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(val));
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}, v);

if (only.includes('svg')) {
  const svg = path.join(dir, 'logo.svg');
  fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="#3355ff"/><circle cx="100" cy="50" r="40" fill="#ffcc00"/></svg>');
  const { ctx, p } = await page('image-tools/svg-to-png');
  await p.locator('input[type=file]').first().setInputFiles(svg);
  await p.getByRole('button', { name: 'Convert to PNG' }).click();
  const img = p.getByAltText('Preview of your image');
  await img.waitFor({ timeout: 30000 });
  await p.waitForTimeout(500);
  const r = await img.evaluate((el) => ({ src: el.getAttribute('src'), w: el.naturalWidth, h: el.naturalHeight, complete: el.complete }));
  check('svg-to-png preview shows the PNG', r.w === 512 && r.h === 256 && /^blob:/.test(r.src), JSON.stringify(r));
  await ctx.close();
}

if (only.includes('meta')) {
  const XMP = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>P37Test</xmp:CreatorTool></rdf:Description></rdf:RDF></x:xmpmeta>';
  // the GPS sample of the repository, re-encoded as WebP with its EXIF (GPS included) kept
  const gpsJpg = fs.readFileSync(path.resolve('scripts/converter-tests/fixtures/exif-gps.jpg'));
  const webp = path.join(dir, 'gps-photo.webp');
  fs.writeFileSync(webp, await sharp(gpsJpg).keepExif().withXmp(XMP).webp().toBuffer());
  const { ctx, p } = await page('image-tools/image-metadata');
  await p.locator('input[type=file]').first().setInputFiles(webp);
  await p.getByText('GPS location — visible to anyone you send this file to').waitFor({ timeout: 30000 });
  const text = await p.locator('main, body').first().innerText();
  check('image-metadata WebP: GPS, camera and XMP shown', /48\.858400/.test(text) && /OnlineConvertToolsCam/.test(text) && /P37Test/.test(text) && !/No embedded metadata/.test(text));
  await p.getByRole('button', { name: 'Remove metadata' }).click();
  await p.locator('[data-removed]').waitFor({ timeout: 30000 });
  const removed = await p.locator('[data-removed]').innerText();
  const out = await download(p, p.locator('a[download]').filter({ hasText: /Download/ }).first());
  const m = await sharp(out).metadata();
  check('image-metadata WebP: "Remove metadata" gives a WebP without EXIF/XMP', m.format === 'webp' && !m.exif && !m.xmp && /EXIF/.test(removed), `${removed} | ${m.format} exif=${!!m.exif} xmp=${!!m.xmp} -> ${path.basename(out)}`);
  await ctx.close();
}

if (only.includes('tiff')) {
  const w = 120, h = 80, raw = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { raw[i * 4] = 200; raw[i * 4 + 1] = 100; raw[i * 4 + 2] = 60; raw[i * 4 + 3] = (i % w) < 30 ? 0 : 255; }
  const tif = path.join(dir, 'scan.tif');
  fs.writeFileSync(tif, await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).tiff({ compression: 'lzw' }).toBuffer());
  const { ctx, p } = await page('image-tools/tiff-to-jpg');
  const offscreen = await p.evaluate(() => typeof OffscreenCanvas !== 'undefined');
  await p.locator('input[type=file]').first().setInputFiles(tif);
  await p.getByRole('button', { name: /Convert to JPG/ }).click();
  const link = p.locator('a[download]').filter({ hasText: /Download/ }).first();
  await Promise.race([link.waitFor({ timeout: 60000 }), p.getByRole('alert').first().waitFor({ timeout: 60000 }).catch(() => {})]);
  if (!(await link.count())) { check(`tiff-to-jpg (OffscreenCanvas on the page: ${offscreen})`, false, await p.locator('body').innerText().then((t) => t.slice(0, 300))); }
  else {
    const out = await download(p, link);
    const m = await sharp(out).metadata();
    const px = await sharp(out).extract({ left: 5, top: 40, width: 1, height: 1 }).raw().toBuffer();
    check(`tiff-to-jpg gives a JPEG (OffscreenCanvas on the page: ${offscreen})`, m.format === 'jpeg' && m.width === w && m.height === h && px[0] > 240 && px[1] > 240 && px[2] > 240, `${m.format} ${m.width}x${m.height}, transparent corner -> ${[...px]}`);
  }
  await ctx.close();
}

if (only.includes('pdfq')) {
  const w = 400, h = 300, raw = Buffer.alloc(w * h * 3);
  let s = 7; const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < w * h; i++) { raw[i * 3] = ((i % w) * 255 / w + rnd() * 40) | 0; raw[i * 3 + 1] = ((i / w) * 255 / h + rnd() * 40) | 0; raw[i * 3 + 2] = (128 + rnd() * 60) | 0; }
  const photo = path.join(dir, 'photo.png');
  fs.writeFileSync(photo, await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer());
  const sizes = {};
  for (const q of [20, 50]) {
    const { ctx, p } = await page('image-tools/image-converter');
    await p.locator('input[type=file]').first().setInputFiles(photo);
    await p.getByLabel('Output format').selectOption('pdf');
    await setRange(p, 'Quality (%)', q);
    await p.waitForFunction((v) => document.querySelector('[data-quality-control] label')?.textContent.includes(`Quality: ${v}%`), q, { timeout: 5000 });
    await p.getByRole('button', { name: /Convert 1 file to PDF/ }).click();
    const link = p.locator('a[download]').filter({ hasText: /Download/ }).first();
    await link.waitFor({ timeout: 60000 });
    const out = await download(p, link);
    sizes[q] = fs.statSync(out).size;
    await ctx.close();
  }
  check('image-converter PDF: quality 20 % gives a smaller file than 50 %', sizes[20] < sizes[50], JSON.stringify(sizes));
}

if (only.includes('epub')) {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file('OEBPS/content.opf', '<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">p37</dc:identifier><dc:title>P37 book</dc:title><dc:language>en</dc:language></metadata><manifest><item id="c1" href="ch1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="ch2.xhtml" media-type="application/xhtml+xml"/><item id="c3" href="ch3.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/></spine></package>');
  const ch = (n) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Ch ${n}</title></head><body><h1>Chapter ${n}</h1><p>Words.</p></body></html>`;
  zip.file('OEBPS/ch1.xhtml', ch(1)); zip.file('OEBPS/ch3.xhtml', ch(3)); // ch2.xhtml missing
  const epub = path.join(dir, 'book.epub');
  fs.writeFileSync(epub, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  const { ctx, p } = await page('pdf-tools/epub-to-pdf');
  let sent = null;
  await p.route('**/api/convert-html-to-pdf', async (route) => {
    sent = route.request().postDataBuffer()?.toString('utf8') || '';
    await route.fulfill({ status: 200, contentType: 'application/pdf', body: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n') });
  });
  await p.locator('input[type=file]').first().setInputFiles(epub);
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  await p.getByText('PDF ready').waitFor({ timeout: 60000 });
  const note = await p.locator('[data-skipped]').innerText().catch(() => '');
  const chapters = (sent?.match(/<div class="chapter">/g) || []).length;
  const empty = /<div class="chapter">\s*<\/div>/.test(sent || '');
  check('epub-to-pdf, chapter file missing: no empty chapter sent, the page says 1 is missing', chapters === 2 && !empty && /1 chapter of this book could not be read/.test(note), `chapters sent ${chapters}, empty ${empty}, note "${note}"`);
  await ctx.close();
}

await b.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
process.exit(fails ? 1 : 0);
