// P35 (06/10, lot 3) — S2 + S3 on every tool page, from the raw HTML (no JavaScript, as a crawler's first pass):
// - S2: a "Related tools" block with 4-6 links to other tool pages, every link in the sitemap (indexable, 200);
// - S3: JSON-LD that parses; WebApplication with offers at 0; BreadcrumbList Home > category > tool; FAQPage only when
//   the FAQ is on the page; every text of the markup (name, description, each question and answer, breadcrumb names)
//   found in the visible text of the page;
// - optional --validate=N: N pages sent to Google's schema.org validator (validator.schema.org), errors counted.
//   node scripts/p35/seo-lot3-check.mjs <origin> [--validate=20]
import fs from 'node:fs';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const validateN = Number((process.argv.find((a) => a.startsWith('--validate=')) || '--validate=0').split('=')[1]);
const WWW = 'https://www.onlineconvertools.com';
const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
const indexable = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(WWW, '') || '/'));
const tools = [];
for (const cat of fs.readdirSync('app/tools')) {
  const d = path.join('app/tools', cat);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const t of fs.readdirSync(d)) if (fs.statSync(path.join(d, t)).isDirectory()) tools.push(`/tools/${cat}/${t}`);
}
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&nbsp;': ' ' };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#x27|#39|nbsp);/g, (m) => ENT[m]); // one pass: "&amp;lt;" stays "&lt;"
const visible = (h) => decode(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

let fails = 0;
const problems = [];
const stats = { pages: 0, relatedPages: 0, links: [], webapp: 0, breadcrumb: 0, faq: 0, faqVisible: 0, invalid: 0 };
const htmlOf = {};
const q = [...tools];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (q.length) {
    const p = q.shift();
    const r = await fetch(origin + p);
    const h = await r.text();
    htmlOf[p] = h;
    stats.pages++;
    const bad = (m) => { fails++; problems.push(`${p}: ${m}`); };
    if (r.status !== 200) { bad(`status ${r.status}`); continue; }
    const text = visible(h);
    // S2
    const block = /<div data-related-tools[^>]*>([\s\S]*?)<\/ul>/.exec(h);
    if (!block) bad('no Related tools block');
    else {
      stats.relatedPages++;
      const links = [...block[1].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      stats.links.push(links.length);
      if (links.length < 4 || links.length > 6) bad(`${links.length} related links`);
      for (const l of links) { if (!indexable.has(l)) bad(`related link not in the sitemap: ${l}`); if (l === p) bad('links to itself'); }
    }
    // S3
    const scripts = [...h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    const graph = [];
    for (const s of scripts) { try { const j = JSON.parse(s); graph.push(...[].concat(j['@graph'] || j)); } catch { stats.invalid++; bad('JSON-LD does not parse'); } }
    const app = graph.find((x) => x['@type'] === 'WebApplication' || x['@type'] === 'SoftwareApplication');
    const crumbs = graph.find((x) => x['@type'] === 'BreadcrumbList');
    const faq = graph.find((x) => x['@type'] === 'FAQPage');
    if (graph.filter((x) => x['@type'] === 'WebApplication').length > 1) bad('two WebApplication blocks');
    if (!app) bad('no WebApplication');
    else {
      stats.webapp++;
      if (!app.offers || String(app.offers.price) !== '0') bad('offers not at 0');
      if (app.url !== WWW + p) bad(`url ${app.url}`);
      if (!text.includes(norm(app.name))) bad(`name not visible: ${app.name}`);
      if (!text.includes(norm(app.description))) bad(`description not visible: ${String(app.description).slice(0, 60)}`);
    }
    if (!crumbs) bad('no BreadcrumbList');
    else {
      stats.breadcrumb++;
      const items = crumbs.itemListElement || [];
      if (items.length !== 3 || items[2].item !== WWW + p || !indexable.has(items[1].item.replace(WWW, ''))) bad('breadcrumb items');
    }
    const faqShown = /Frequently Asked Questions/.test(text);
    if (faqShown) stats.faqVisible++;
    if (faq) {
      stats.faq++;
      if (!faqShown) bad('FAQPage without a visible FAQ');
      for (const qa of faq.mainEntity || []) {
        if (!text.includes(norm(qa.name))) bad(`question not visible: ${qa.name}`);
        if (!text.includes(norm(qa.acceptedAnswer.text))) bad(`answer not visible: ${String(qa.acceptedAnswer.text).slice(0, 60)}`);
      }
    } else if (faqShown) bad('visible FAQ without FAQPage');
  }
}));
const l = stats.links.sort((a, b) => a - b);
console.log(JSON.stringify({ ...stats, links: { pages: l.length, min: l[0], median: l[Math.floor(l.length / 2)], max: l[l.length - 1], total: l.reduce((a, b) => a + b, 0) } }));

// Google's schema.org validator on a sample (same HTML as above)
if (validateN) {
  const sample = tools.filter((_, i) => i % Math.max(1, Math.floor(tools.length / validateN)) === 0).slice(0, validateN);
  let errors = 0, warnings = 0, checked = 0;
  for (const p of sample) {
    const body = new URLSearchParams({ html: htmlOf[p] });
    const r = await fetch('https://validator.schema.org/validate', { method: 'POST', body });
    const raw = await r.text();
    let j;
    try { j = JSON.parse(raw.replace(/^\)\]\}'\s*/, '')); } catch { console.log(`validator: unreadable answer for ${p} (${r.status})`); continue; }
    checked++;
    const ne = j.totalNumErrors ?? 0, nw = j.totalNumWarnings ?? 0;
    errors += ne; warnings += nw;
    const types = (j.tripleGroups || []).map((g) => g.type).join(',');
    console.log(`validator ${p}: ${j.numObjects} objects (${types}), ${ne} errors, ${nw} warnings`);
    if (ne) { fails++; problems.push(`${p}: validator errors ${JSON.stringify((j.tripleGroups || []).flatMap((g) => g.errors || []).slice(0, 3))}`); }
  }
  console.log(`validator: ${checked} pages, ${errors} errors, ${warnings} warnings`);
}
for (const m of problems.slice(0, 40)) console.log('FAIL', m);
console.log(fails ? `${fails} problems` : 'ALL PASS');
process.exit(fails ? 1 : 0);
