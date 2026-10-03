// P27 phase 3: every conversion our Gotenberg tools send, against ONE Gotenberg service on Railway, saved for a
// page-by-page comparison of two versions (scripts/p26/compare-pdfs.mjs: page count and sizes, text, every page at
// 72 dpi to the pixel). Superset of scripts/p26/gotenberg-probe.mjs's conversions: Word, Excel, PowerPoint in every
// format the pages accept (docs/audit/fixtures-p21-office), the fidelity documents, Office math and scripts
// (scripts/p27/gotenberg-fixtures), HTML (file, fidelity page, public resources), the EPUB and MOBI books as our pages
// build them, and URL to PDF.
//   node scripts/p27/gotenberg-compare.mjs <railway-service> <out-dir> [--books=<dir with epub.html, mobi.html>]
// Credentials come from the Railway CLI (the owner's login) and stay in this process: never printed, never written.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const books = process.argv.find((a) => a.startsWith('--books='))?.split('=')[1];
fs.mkdirSync(outDir, { recursive: true });
const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const base = `https://${vars.RAILWAY_PUBLIC_DOMAIN}`;
const auth = 'Basic ' + Buffer.from(`${vars.GOTENBERG_API_BASIC_AUTH_USERNAME}:${vars.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');

async function post(route, files, fields = {}) {
  const fd = new FormData();
  for (const [name, buf] of files) fd.append('files', new Blob([buf]), name);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const t = Date.now();
  const r = await fetch(base + route, { method: 'POST', headers: { Authorization: auth }, body: fd, signal: AbortSignal.timeout(240_000) });
  return { status: r.status, body: Buffer.from(await r.arrayBuffer()), ms: Date.now() - t };
}

const version = await fetch(base + '/version', { headers: { Authorization: auth } }).then((r) => r.text()).catch(() => '?');
const health = await fetch(base + '/health').then((r) => r.json()).catch(() => ({}));
console.log(`service ${svc} version ${version.trim()} health ${health.status}`);

const office = (f) => [path.basename(f).replace(/\./g, '_'), '/forms/libreoffice/convert', [[path.basename(f), fs.readFileSync(f)]], {}];
const conv = [];
for (const f of ['scripts/audit/fixtures/files/sample.docx', 'scripts/audit/fixtures/files/sample.xlsx', 'scripts/audit/fixtures/files/sample.pptx',
  'scripts/audit/fixtures/files/sample.xls', 'scripts/converter-tests/fixtures/edge-cases.xlsx',
  ...['01.docx', '02.docx', '03.xlsx', '04.xlsx', '05.pptx', '06.pptx'].map((n) => `docs/audit/fixtures-fidelite/fidelite-${n}`),
  ...fs.readdirSync('docs/audit/fixtures-p21-office').filter((n) => !n.endsWith('.md')).map((n) => `docs/audit/fixtures-p21-office/${n}`),
  'scripts/p27/gotenberg-fixtures/math.docx', 'scripts/p27/gotenberg-fixtures/multilingual.docx',
  // P28: real Word documents with equations (Word-native Office Math in every Word format, Equation Editor 3.0 /
  // MathType objects, LibreOffice Math objects) -- scripts/p28/equations/SOURCES.md.
  ...fs.readdirSync('scripts/p28/equations/corpus').map((n) => `scripts/p28/equations/corpus/${n}`),
  // P28: an Excel workbook and a PowerPoint deck made by Office 2024 with its default theme (Aptos, Aptos Narrow,
  // Aptos Display) -- the font rule of services/gotenberg/fonts.conf
  ...fs.readdirSync('scripts/p28/aptos/corpus').map((n) => `scripts/p28/aptos/corpus/${n}`)]) conv.push(office(f));
const html = (name, buf, extra = {}) => conv.push([name, '/forms/chromium/convert/html', [['index.html', buf]], { preferCssPageSize: 'true', ...extra }]);
html('html', fs.readFileSync('scripts/audit/fixtures/files/sample.html'));
html('html-fidelity', fs.readFileSync('docs/audit/fidelite-marche/html-to-pdf-test.html'));
html('html-public-resources', Buffer.from(`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lobster&display=block">
<style>h1{font-family:'Lobster',serif;font-size:48px}</style></head><body><h1>Public font</h1>
<img src="https://www.gstatic.com/images/branding/product/2x/translate_96dp.png" width="192" height="192" alt="public image">
</body></html>`), { waitDelay: '2s' });
html('html-scripts', Buffer.from(`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif}</style></head><body>
<h1>Scripts and shaping</h1><p lang="el">Ελληνικά: η γλώσσα της Ελλάδας.</p><p dir="rtl" lang="ar">اللغة العربية لغة رسمية.</p>
<p lang="zh">中文：长期保存电子文档。</p><p lang="ja">日本語のテキスト。</p><p>office, affiche, efficient — fidélité, Œuvre.</p>
<table border="1" style="border-collapse:collapse"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></body></html>`));
for (const b of ['epub', 'mobi']) {
  const f = books && path.join(books, `${b}.html`);
  if (f && fs.existsSync(f)) html(b, fs.readFileSync(f));
  else console.log(`SKIP ${b}: no --books dir with ${b}.html (scripts/p26/capture-book-html.mjs)`);
}
// URL to PDF: a static public page (our own /about would load analytics; example.com is the stable control).
conv.push(['url-example', '/forms/chromium/convert/url', [], { url: 'https://example.com/' }]);

let pass = 0, fail = 0;
for (const [name, route, files, fields] of conv) {
  const r = await post(route, files, fields).catch((e) => ({ status: 0, body: Buffer.from(String(e)), ms: 0 }));
  const ok = r.status === 200 && r.body.subarray(0, 5).toString() === '%PDF-';
  if (ok) fs.writeFileSync(path.join(outDir, `${name}.pdf`), r.body);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} status ${r.status} ${r.body.length} bytes ${r.ms} ms${ok ? '' : ' ' + r.body.toString('utf8').slice(0, 120)}`);
}
console.log(`gotenberg-compare ${svc}: ${pass} converted, ${fail} failed`);
