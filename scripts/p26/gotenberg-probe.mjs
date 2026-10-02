// P26 (03/10): probe one Gotenberg service on Railway directly, the way our routes call it.
//   node scripts/p26/gotenberg-probe.mjs <railway-service> <out-dir> [--only=conv|ssrf|misc]
// 1. Conversions our six tools send (Word, Excel, PowerPoint through LibreOffice; HTML, EPUB and MOBI books through
//    Chromium, the books as the HTML our pages build — captured by capture-book-html.mjs into <out-dir>/../books/):
//    each PDF is saved, then compare-pdfs.mjs renders both runs page by page.
// 2. SSRF: an uploaded HTML page that asks Chromium to load internal addresses (iframe + img), printed; the text of
//    the PDF says whether the internal answer got in. A public page is the control (it must still load).
// 3. Webhook and downloadFrom pointed at Gotenberg's own loopback.
// Credentials come from the Railway CLI (the owner's login) and stay in this process: never printed, never written.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
if (!svc || !outDir) { console.error('usage: gotenberg-probe.mjs <railway-service> <out-dir>'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const base = `https://${vars.RAILWAY_PUBLIC_DOMAIN}`;
const auth = 'Basic ' + Buffer.from(`${vars.GOTENBERG_API_BASIC_AUTH_USERNAME}:${vars.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');
const fixtures = path.resolve('scripts/audit/fixtures/files');
const books = path.resolve(outDir, '..', 'books');

async function post(route, files, fields = {}, headers = {}) {
  const fd = new FormData();
  for (const [name, buf] of files) fd.append('files', new Blob([buf]), name);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const t = Date.now();
  const r = await fetch(base + route, { method: 'POST', headers: { Authorization: auth, ...headers }, body: fd, signal: AbortSignal.timeout(240_000) });
  const body = Buffer.from(await r.arrayBuffer());
  return { status: r.status, body, ms: Date.now() - t, type: r.headers.get('content-type') || '' };
}
const pdfText = (file) => { try { return execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' }); } catch { return ''; } };
const log = (...a) => console.log(...a);

const health = await fetch(base + '/health').then((r) => r.json()).catch((e) => ({ error: String(e) }));
const version = await fetch(base + '/version', { headers: { Authorization: auth } }).then((r) => r.text()).catch(() => '?');
log(`service ${svc} version ${version.trim()} health ${health.status} chromium ${health.details?.chromium?.status} libreoffice ${health.details?.libreoffice?.status}`);

// ---- 1. conversions --------------------------------------------------------------------------------------------
if (!only || only === 'conv') {
  const conv = [
    ['word', '/forms/libreoffice/convert', [['sample.docx', fs.readFileSync(path.join(fixtures, 'sample.docx'))]], {}],
    ['excel', '/forms/libreoffice/convert', [['sample.xlsx', fs.readFileSync(path.join(fixtures, 'sample.xlsx'))]], {}],
    ['powerpoint', '/forms/libreoffice/convert', [['sample.pptx', fs.readFileSync(path.join(fixtures, 'sample.pptx'))]], {}],
    ['html', '/forms/chromium/convert/html', [['index.html', fs.readFileSync(path.join(fixtures, 'sample.html'))]], { preferCssPageSize: 'true' }],
  ];
  // Richer real documents from the fidelity benches (tables, fonts, charts, slides) and the other accepted inputs.
  const extra = ['docs/audit/fixtures-fidelite/fidelite-01.docx', 'docs/audit/fixtures-fidelite/fidelite-02.docx',
    'docs/audit/fixtures-fidelite/fidelite-03.xlsx', 'docs/audit/fixtures-fidelite/fidelite-04.xlsx',
    'docs/audit/fixtures-fidelite/fidelite-05.pptx', 'docs/audit/fixtures-fidelite/fidelite-06.pptx',
    'docs/audit/fixtures-p21-office/text.odt', 'docs/audit/fixtures-p21-office/text.rtf',
    'scripts/audit/fixtures/files/sample.xls', 'scripts/converter-tests/fixtures/edge-cases.xlsx'];
  for (const f of extra) conv.push([path.basename(f).replace(/\./g, '_'), '/forms/libreoffice/convert', [[path.basename(f), fs.readFileSync(f)]], {}]);
  conv.push(['html-fidelity', '/forms/chromium/convert/html', [['index.html', fs.readFileSync('docs/audit/fidelite-marche/html-to-pdf-test.html')]], { preferCssPageSize: 'true' }]);
  // A visitor's HTML file that links PUBLIC resources (a stylesheet + web font and an image): they must keep loading.
  conv.push(['html-public-resources', '/forms/chromium/convert/html', [['index.html', Buffer.from(`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lobster&display=block">
<style>h1{font-family:'Lobster',serif;font-size:48px}</style></head><body><h1>Public font</h1>
<img src="https://www.gstatic.com/images/branding/product/2x/translate_96dp.png" width="192" height="192" alt="public image">
</body></html>`)]], { preferCssPageSize: 'true', waitDelay: '2s' }]);
  for (const b of ['epub', 'mobi']) {
    const f = path.join(books, `${b}.html`);
    if (fs.existsSync(f)) conv.push([b, '/forms/chromium/convert/html', [['index.html', fs.readFileSync(f)]], { preferCssPageSize: 'true' }]);
    else log(`SKIP ${b}: ${f} missing (run capture-book-html.mjs)`);
  }
  for (const [name, route, files, fields] of conv) {
    const r = await post(route, files, fields);
    const ok = r.status === 200 && r.body.subarray(0, 5).toString() === '%PDF-';
    if (ok) fs.writeFileSync(path.join(outDir, `${name}.pdf`), r.body);
    log(`${ok ? 'PASS' : 'FAIL'} conv ${name} status ${r.status} ${r.body.length} bytes ${r.ms} ms`);
  }
}

// ---- 2. SSRF through an uploaded HTML page -------------------------------------------------------------------------
if (!only || only === 'ssrf') {
  const targets = [
    ['loopback-v4', 'http://127.0.0.1:3000/health'],
    ['localhost', 'http://localhost:3000/health'],
    ['loopback-v6', 'http://[::1]:3000/health'],
    ['mapped-v6', 'http://[::ffff:127.0.0.1]:3000/health'],
    ['zero', 'http://0.0.0.0:3000/health'],
    ['gotenberg-v2-internal', 'http://gotenberg-v2.railway.internal:3000/health'],
    ['gotenberg-fonts-internal', 'http://gotenberg-fonts.railway.internal:3000/health'],
    ['pdf-tools-internal', 'http://allformatconvert-clean.railway.internal:8080/health'],
    ['media-internal', 'http://media-processing.railway.internal:8080/health'],
    ['metadata', 'http://169.254.169.254/latest/meta-data/'],
    ['cgnat-literal', 'http://100.64.0.1/'],
    ['benchmark-literal', 'http://198.18.0.1/'],
    ['file-scheme', 'file:///etc/hostname'],
    ['control-public', 'https://example.com/'],
  ];
  for (const [name, url] of targets) {
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><p>PROBE-START</p>
<iframe src="${url}" width="900" height="400"></iframe>
<p id="img">IMG-PENDING</p><img src="${url}" onload="document.getElementById('img').textContent='IMG-LOADED'" onerror="document.getElementById('img').textContent='IMG-ERROR'">
<p>PROBE-END</p></body></html>`;
    const r = await post('/forms/chromium/convert/html', [['index.html', Buffer.from(html)]], { waitDelay: '4s' });
    let verdict = `status ${r.status}`;
    if (r.status === 200) {
      const f = path.join(outDir, `ssrf-${name}.pdf`);
      fs.writeFileSync(f, r.body);
      const text = pdfText(f).replace(/\s+/g, ' ').trim();
      const inner = text.replace(/PROBE-START|PROBE-END|IMG-PENDING|IMG-LOADED|IMG-ERROR/g, '').trim();
      // What got into the page from the target: Gotenberg's /health JSON, pdf-tools' {"ok":…}, example.com's title,
      // or Chromium's own error page ("This site can't be reached", ERR_…).
      const reached = /"status"|"ok"|binaries|Example Domain|documentation examples|ami-id|instance-id/.test(inner);
      verdict += reached ? ' REACHED' : ' not-reached';
      verdict += ` | ${inner.slice(0, 160) || '(iframe empty)'}`;
    } else verdict += ` | ${r.body.toString('utf8').slice(0, 160)}`;
    log(`ssrf ${name} ${url} -> ${verdict}`);
  }
}

// ---- 3. webhook and downloadFrom -------------------------------------------------------------------------------
if (!only || only === 'misc') {
  const simple = Buffer.from('<!doctype html><p>hello</p>');
  const wh = await post('/forms/chromium/convert/html', [['index.html', simple]], {}, {
    'Gotenberg-Webhook-Url': 'http://127.0.0.1:3000/health', 'Gotenberg-Webhook-Error-Url': 'http://127.0.0.1:3000/health',
  });
  log(`webhook-loopback -> status ${wh.status} ${wh.type} ${wh.type.includes('pdf') ? '(converted synchronously, webhook ignored)' : wh.body.toString('utf8').slice(0, 160)}`);
  const dl = await post('/forms/libreoffice/convert', [], { downloadFrom: JSON.stringify([{ url: 'http://127.0.0.1:3000/health' }]) });
  log(`downloadFrom-loopback -> status ${dl.status} ${dl.body.toString('utf8').slice(0, 160)}`);
  const dlp = await post('/forms/libreoffice/convert', [], { downloadFrom: JSON.stringify([{ url: 'https://example.com/' }]) });
  log(`downloadFrom-public -> status ${dlp.status} ${dlp.body.toString('utf8').slice(0, 160)}`);
}
