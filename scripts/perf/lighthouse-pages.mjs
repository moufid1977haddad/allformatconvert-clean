// Lighthouse on every page of a site, MOBILE first (Lighthouse's default mobile emulation: Moto G Power, simulated
// slow 4G + 4x CPU slowdown), one page at a time so runs don't slow each other down.
// Pages = every app/tools/<category>/<tool>/page.* on disk + every category + the site pages (same list as
// scripts/browser-tests/all-pages-load.mjs, plus /tools, /about, /privacy, /terms, /contact), or the URLs given with
// --urls=a,b,c (absolute, for competitors' pages).
// Usage:
//   node scripts/perf/lighthouse-pages.mjs <origin> --out=<file.json> [--desktop] [--only=/tools/x,/tools/y] [--urls=...]
// Lighthouse itself is not a dependency of the site: set LIGHTHOUSE_CLI to the path of lighthouse/cli/index.js
// (e.g. installed with `npm i lighthouse@13.5.0` in a scratch folder); CHROME_PATH to a Chrome/Chromium binary.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const out = opt('out');
if (!out) { console.error('--out=<file.json> required'); process.exit(1); }
const cli = process.env.LIGHTHOUSE_CLI;
if (!cli || !fs.existsSync(cli)) { console.error('LIGHTHOUSE_CLI must point to lighthouse/cli/index.js'); process.exit(1); }
const desktop = args.includes('--desktop');

let urls;
if (opt('urls')) urls = opt('urls').split(',');
else {
  const origin = new URL(args.find((a) => !a.startsWith('--'))).origin;
  const root = path.resolve('app/tools');
  const rel = ['/', '/tools', '/about', '/privacy', '/terms', '/contact'];
  for (const cat of fs.readdirSync(root).sort()) {
    const cdir = path.join(root, cat); if (!fs.statSync(cdir).isDirectory()) continue;
    rel.push(`/tools/${cat}`);
    for (const t of fs.readdirSync(cdir).sort()) { const tdir = path.join(cdir, t); if (fs.statSync(tdir).isDirectory() && fs.readdirSync(tdir).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) rel.push(`/tools/${cat}/${t}`); }
  }
  const only = opt('only') ? opt('only').split(',') : null;
  urls = rel.filter((u) => !only || only.includes(u)).map((u) => origin + u);
}

// Keep what the report needs: 4 scores, lab Web Vitals, weights, and the failing audits of each category.
function summarize(lhr) {
  const a = lhr.audits;
  const num = (id) => (a[id] && typeof a[id].numericValue === 'number' ? Math.round(a[id].numericValue) : null);
  const items = (id) => (a[id] && a[id].details && a[id].details.items) || [];
  const byType = Object.fromEntries(items('resource-summary').map((r) => [r.resourceType, { bytes: r.transferSize, n: r.requestCount }]));
  const failing = {};
  for (const [cid, cat] of Object.entries(lhr.categories)) {
    if (cid === 'performance') continue;
    failing[cid] = cat.auditRefs.filter((r) => r.weight > 0 && a[r.id] && a[r.id].score !== null && a[r.id].score < 1).map((r) => r.id);
  }
  // Which elements fail each accessibility audit (up to 6 per audit), to fix the pattern rather than guess it.
  const nodes = {};
  for (const id of failing.accessibility || []) nodes[id] = items(id).slice(0, 6).map((it) => (it.node ? `${it.node.selector} :: ${(it.node.snippet || '').slice(0, 140)}${it.node.explanation && id === 'color-contrast' ? ' :: ' + (it.node.explanation.match(/contrast of [\d.]+ \(foreground color: #\w+, background color: #\w+/) || [''])[0] : ''}` : JSON.stringify(it).slice(0, 160)));
  const opportunities = ['unused-javascript', 'render-blocking-resources', 'unminified-javascript', 'uses-responsive-images', 'modern-image-formats', 'offscreen-images', 'font-display', 'legacy-javascript', 'unused-css-rules', 'bootup-time', 'mainthread-work-breakdown', 'third-party-summary', 'lcp-lazy-loaded', 'largest-contentful-paint-element', 'layout-shifts']
    .filter((id) => a[id] && a[id].score !== null && a[id].score < 0.9).map((id) => ({ id, value: a[id].displayValue || '' }));
  return {
    url: lhr.finalDisplayedUrl || lhr.requestedUrl,
    scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, c]) => [k, c.score === null ? null : Math.round(c.score * 100)])),
    lcp: num('largest-contentful-paint'), fcp: num('first-contentful-paint'), cls: a['cumulative-layout-shift'] ? +a['cumulative-layout-shift'].numericValue.toFixed(3) : null,
    tbt: num('total-blocking-time'), si: num('speed-index'), tti: num('interactive'),
    totalBytes: num('total-byte-weight'), js: byType.script || null, font: byType.font || null, image: byType.image || null, thirdParty: byType['third-party'] || null,
    failing, nodes, opportunities,
    // P27: which element is the LCP and how its time splits (render delay = waiting for scripts / a re-render)
    lcpElement: (() => { const d = a['lcp-breakdown-insight']?.details?.items || []; const n = d.find((x) => x.type === 'node'); return n ? `${n.selector} :: ${(n.snippet || '').slice(0, 90)}` : null; })(),
    lcpRenderDelay: (() => { const t = (a['lcp-breakdown-insight']?.details?.items || []).find((x) => x.type === 'table'); const r = t?.items?.find((x) => x.subpart === 'elementRenderDelay'); return r ? Math.round(r.duration) : null; })(),
    runtimeError: lhr.runtimeError ? lhr.runtimeError.code : null,
  };
}

function runOne(url) {
  return new Promise((resolve) => {
    const tmp = path.join(os.tmpdir(), `lh-${process.pid}-${Date.now()}.json`);
    // P27: LH_CHROME_FLAGS adds flags (e.g. --ignore-certificate-errors behind scripts/perf/h2-proxy.mjs)
    const flags = [cli, url, '--output=json', `--output-path=${tmp}`, '--quiet', `--chrome-flags=--headless=new --no-sandbox ${process.env.LH_CHROME_FLAGS || ''}`.trim(),
      '--only-categories=performance,accessibility,best-practices,seo', '--max-wait-for-load=45000',
      // our own measurement must not count as a visit in Google Analytics (the gtag library itself still loads)
      '--blocked-url-patterns=*google-analytics.com/g/collect*', '--blocked-url-patterns=*analytics.google.com/g/collect*'];
    if (desktop) flags.push('--preset=desktop');
    const p = spawn(process.execPath, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', (d) => { err += d; });
    p.on('close', () => {
      try { const lhr = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.rmSync(tmp, { force: true }); resolve(summarize(lhr)); }
      catch { resolve({ url, error: err.slice(-400) || 'no report' }); }
    });
  });
}

const results = fs.existsSync(out) && args.includes('--resume') ? JSON.parse(fs.readFileSync(out, 'utf8')) : [];
const done = new Set(results.map((r) => r.url));
const t0 = Date.now();
for (const u of urls) {
  if (done.has(u)) continue;
  const r = await runOne(u);
  results.push(r);
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  const s = r.scores || {};
  console.log(r.error ? `ERROR ${u} ${r.error.slice(0, 120)}` : `${s.performance}/${s.accessibility}/${s['best-practices']}/${s.seo} LCP ${r.lcp} CLS ${r.cls} TBT ${r.tbt} JS ${r.js && Math.round(r.js.bytes / 1024)}K ${u}`);
}
console.log(`${results.length} pages in ${Math.round((Date.now() - t0) / 1000)} s -> ${out}`);
