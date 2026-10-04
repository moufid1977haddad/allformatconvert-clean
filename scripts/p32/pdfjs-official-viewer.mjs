// P32 (04/10) — the kit PDF (pdf-avec-images.pdf) in the OFFICIAL pdf.js viewer of the version the site ships (5.7.284,
// mozilla/pdf.js release pdfjs-5.7.284-dist.zip), in local WebKit (iPhone user agent) and Chromium, to separate "pdf.js
// itself" from "our page". Times every page's rendering ("pagerendered" events of the viewer's event bus).
//   node scripts/p32/pdfjs-official-viewer.mjs <dir of the unzipped release, with web/kit.pdf>
import { webkit, chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ftl': 'text/plain', '.bcmap': 'application/octet-stream', '.pfb': 'application/octet-stream', '.ttf': 'font/ttf', '.icc': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(path.resolve(dir)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(3497, '127.0.0.1', r));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

for (const [name, type, opts] of [['webkit-iphone', webkit, { userAgent: UA, isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } }], ['chromium', chromium, {}]]) {
  const b = await type.launch();
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' || /Warning|warn/i.test(m.text())) errors.push(m.text().slice(0, 160)); });
  await p.addInitScript(() => {
    window.__rendered = [];
    document.addEventListener('webviewerloaded', () => {
      // the viewer's own options: keep its defaults (what an official viewer does on this browser)
    });
  });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:3497/web/viewer.html?file=kit.pdf#zoom=page-fit', { waitUntil: 'load' });
  await p.waitForFunction(() => window.PDFViewerApplication && window.PDFViewerApplication.eventBus, null, { timeout: 30000 });
  await p.evaluate(() => {
    const app = window.PDFViewerApplication;
    app.eventBus.on('pagerendered', (e) => window.__rendered.push({ page: e.pageNumber, ms: Math.round(performance.now()), error: e.error ? String(e.error) : null }));
  });
  // render every page: scroll to each
  for (let n = 1; n <= 3; n++) {
    await p.evaluate((k) => { window.PDFViewerApplication.page = k; }, n);
    await p.waitForFunction((k) => window.__rendered.some((r) => r.page === k), n, { timeout: 60000 }).catch(() => {});
  }
  const rendered = await p.evaluate(() => window.__rendered);
  const info = await p.evaluate(() => ({ version: window.pdfjsLib?.version, imageDecoder: typeof ImageDecoder, offscreen: typeof OffscreenCanvas, fonts: document.fonts ? document.fonts.size : -1 }));
  console.log(`${name}: pdf.js ${info.version}, ImageDecoder=${info.imageDecoder}, OffscreenCanvas=${info.offscreen}, FontFace set size=${info.fonts}`);
  console.log(`  pages rendered: ${JSON.stringify(rendered)} (load→last ${Date.now() - t0} ms)`);
  console.log(`  errors/warnings: ${errors.length ? errors.join(' | ') : 'none'}`);
  await p.screenshot({ path: path.join(dir, `viewer-${name}.png`) });
  await b.close();
}
server.close();
