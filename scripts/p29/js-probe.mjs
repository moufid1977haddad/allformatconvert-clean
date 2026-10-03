// P29 (04/10): does any script run in Gotenberg's Chromium? An uploaded HTML page (the way /api/convert-html-to-pdf sends
// it) tries every way we know to run script; whatever runs writes a marker into the page, and the PDF's text says which
// ran. Run against a service with JavaScript on (control: markers appear) and one with --chromium-disable-javascript.
//   node scripts/p29/js-probe.mjs <railway-service> <out-dir>
// Credentials come from the Railway CLI (the owner's login) and stay in this process: never printed, never written.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, outDir] = process.argv.slice(2);
if (!svc || !outDir) { console.error('usage: js-probe.mjs <railway-service> <out-dir>'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const base = `https://${vars.RAILWAY_PUBLIC_DOMAIN}`;
const auth = 'Basic ' + Buffer.from(`${vars.GOTENBERG_API_BASIC_AUTH_USERNAME}:${vars.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');

// Each case: a fragment whose script, if it runs, appends the text JSRAN-<name> to the top document (or its own frame).
const mark = (n) => `(window.top||window).document.body.insertAdjacentText('beforeend',' JSRAN-${n} ')`;
const enc = (s) => encodeURIComponent(s);
const cases = {
  inline: `<script>${mark('inline')}</script>`,
  module: `<script type="module">${mark('module')}</script>`,
  datasrc: `<script src="data:text/javascript,${enc(mark('datasrc'))}"></script>`,
  onload: `<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onload="${mark('onload')}">`,
  onerror: `<img src="nope.png" onerror="${mark('onerror')}">`,
  bodyonload: `<svg width="1" height="1" onload="${mark('bodyonload')}"></svg>`,
  svgscript: `<svg width="1" height="1"><script>${mark('svgscript')}</script></svg>`,
  srcdoc: `<iframe srcdoc="<script>document.write('JSRAN-srcdoc')</script>" width="300" height="40"></iframe>`,
  nested: `<iframe srcdoc="<iframe srcdoc=&quot;<script>document.write('JSRAN-nested')</script>&quot;></iframe>" width="300" height="60"></iframe>`,
  dataframe: `<iframe src="data:text/html,${enc("<script>document.write('JSRAN-dataframe')</script>")}" width="300" height="40"></iframe>`,
  jsframe: `<iframe src="javascript:'JSRAN-jsframe'" width="300" height="40"></iframe>`,
  object: `<object data="data:text/html,${enc("<script>document.write('JSRAN-object')</script>")}" width="300" height="40"></object>`,
  embedsvg: `<embed src="data:image/svg+xml,${enc("<svg xmlns='http://www.w3.org/2000/svg' onload=\"document.documentElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg','text')).textContent='JSRAN-embedsvg'\"><text y='20'>svg</text></svg>")}" width="300" height="40">`,
  timer: `<script>setTimeout(()=>{${mark('timer')}},300)</script>`,
  worker: `<script>new Worker('data:text/javascript,postMessage(1)').onmessage=()=>{${mark('worker')}}</script>`,
  refresh: `<meta http-equiv="refresh" content="0;url=javascript:document.write('JSRAN-refresh')">`,
  autofocus: `<input autofocus onfocus="${mark('autofocus')}">`,
  details: `<details open ontoggle="${mark('details')}"><summary>d</summary></details>`,
};
const noscript = `<noscript>NOSCRIPT-SHOWN</noscript>`;

async function convert(html, name) {
  const fd = new FormData();
  fd.append('files', new Blob([html]), 'index.html');
  fd.append('preferCssPageSize', 'true');
  fd.append('waitDelay', '1s');
  const r = await fetch(base + '/forms/chromium/convert/html', { method: 'POST', headers: { Authorization: auth }, body: fd, signal: AbortSignal.timeout(120_000) });
  const body = Buffer.from(await r.arrayBuffer());
  const file = path.join(outDir, `${name}.pdf`);
  if (r.status === 200) fs.writeFileSync(file, body);
  const text = r.status === 200 ? execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' }) : '';
  return { status: r.status, text };
}

const health = await fetch(base + '/health').then((r) => r.json()).catch(() => ({}));
console.log(`service ${svc} health ${health.status} chromium ${health.details?.chromium?.status}`);
let ran = 0;
for (const [n, frag] of Object.entries(cases)) {
  const { status, text } = await convert(`<!doctype html><html><head><meta charset="utf-8"></head><body><p>case ${n}</p>${frag}</body></html>`, n);
  const hit = (text.match(/JSRAN-[a-z]+/g) || []).join(',');
  if (hit) ran++;
  console.log(`${status !== 200 ? 'ERROR' : hit ? 'RAN  ' : 'NOJS '} ${n.padEnd(11)} status ${status} ${hit}`);
}
const ns = await convert(`<!doctype html><html><body><p>noscript</p>${noscript}</body></html>`, 'noscript');
console.log(`noscript content shown: ${/NOSCRIPT-SHOWN/.test(ns.text)} (status ${ns.status})`);
console.log(`js-probe ${svc}: ${ran}/${Object.keys(cases).length} cases ran script`);
