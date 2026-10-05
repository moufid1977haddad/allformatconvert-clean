// P34 lot C (05/10) — READ-ONLY technical SEO audit of the local production build (or any origin). Every URL of the
// sitemap (its www host mapped to the origin) plus every tool page on disk, fetched as raw HTML (no JS, as a crawler's
// first pass). Per page: status, <title> and description lengths, canonical (present, absolute www, self), hreflang,
// robots meta, number of <h1>, words of visible text (main content, scripts/styles removed) and of the SEO block,
// internal links to other tool pages, JSON-LD types. Then: duplicates, pages on disk missing from the sitemap and the
// reverse, thin pages. Writes a JSON next to the summary printed.
//   node scripts/p34/seo-audit.mjs <origin> <out.json>
import fs from 'node:fs';
import path from 'node:path';

const [originArg, out] = process.argv.slice(2);
const origin = new URL(originArg).origin;
const WWW = 'https://www.onlineconvertools.com';
const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
const smPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(WWW, '') || '/');
const disk = [];
for (const cat of fs.readdirSync('app/tools')) {
  const d = path.join('app/tools', cat);
  if (!fs.statSync(d).isDirectory()) continue;
  disk.push(`/tools/${cat}`);
  for (const t of fs.readdirSync(d)) if (fs.statSync(path.join(d, t)).isDirectory() && fs.readdirSync(path.join(d, t)).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) disk.push(`/tools/${cat}/${t}`);
}
const all = [...new Set([...smPaths, ...disk])];
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const words = (t) => (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
const attr = (h, re) => (re.exec(h) || [])[1] || null;
const rows = [];
let i = 0;
async function one(p) {
  const r = await fetch(origin + p, { redirect: 'manual' });
  const h = await r.text();
  const title = attr(h, /<title[^>]*>([\s\S]*?)<\/title>/i)?.replace(/&amp;/g, '&').trim() || null;
  const desc = attr(h, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  const canon = attr(h, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  const robots = attr(h, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i);
  const hreflang = (h.match(/hreflang=/gi) || []).length;
  const h1 = (h.match(/<h1[\s>]/gi) || []).length;
  const main = attr(h, /<main[^>]*>([\s\S]*?)<\/main>/i) || h;
  const body = strip(main);
  const nav = h.replace(/<main[\s\S]*<\/main>/i, '');
  const jsonld = [...h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => { try { const j = JSON.parse(m[1]); return [].concat(j['@graph'] || j).map((x) => x['@type']); } catch { return ['INVALID']; } });
  const links = new Set([...main.matchAll(/href="(\/tools\/[a-z0-9-]+\/[a-z0-9-]+)"/g)].map((m) => m[1]).filter((u) => u !== p));
  rows.push({ path: p, status: r.status, inSitemap: smPaths.includes(p), onDisk: disk.includes(p), title, titleLen: title?.length || 0, desc, descLen: desc?.length || 0, canonical: canon, canonicalOk: canon === WWW + (p === '/' ? '' : p) || canon === WWW + p, robots, hreflang, h1, words: words(body), navWords: words(strip(nav)), toolLinks: links.size, jsonld });
}
const queue = [...all];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) { const p = queue.shift(); try { await one(p); } catch (e) { rows.push({ path: p, error: String(e) }); } if (++i % 50 === 0) console.error(i); } }));
rows.sort((a, b) => a.path.localeCompare(b.path));
const dup = (k) => { const m = new Map(); for (const r of rows) if (r[k]) m.set(r[k], [...(m.get(r[k]) || []), r.path]); return [...m.entries()].filter(([, v]) => v.length > 1); };
const tools = rows.filter((r) => /^\/tools\/[^/]+\/[^/]+$/.test(r.path));
const q = (arr, f) => { const v = arr.map(f).sort((a, b) => a - b); return { min: v[0], p10: v[Math.floor(v.length * 0.1)], median: v[Math.floor(v.length / 2)], max: v[v.length - 1] }; };
const summary = {
  pages: rows.length, sitemap: smPaths.length, tools: tools.length,
  notOk: rows.filter((r) => r.status !== 200).map((r) => `${r.path} ${r.status}`),
  missingFromSitemap: rows.filter((r) => r.onDisk && !r.inSitemap).map((r) => r.path),
  sitemapNotOnDisk: rows.filter((r) => r.inSitemap && !r.onDisk && r.path.startsWith('/tools/')).map((r) => r.path),
  noTitle: rows.filter((r) => !r.title).map((r) => r.path), titleOver60: rows.filter((r) => r.titleLen > 60).length, titleOver70: rows.filter((r) => r.titleLen > 70).map((r) => `${r.path} (${r.titleLen})`),
  noDesc: rows.filter((r) => !r.desc).map((r) => r.path), descOver160: rows.filter((r) => r.descLen > 160).length, descUnder70: rows.filter((r) => r.desc && r.descLen < 70).map((r) => r.path),
  canonicalBad: rows.filter((r) => !r.canonicalOk).map((r) => `${r.path} → ${r.canonical}`),
  hreflangPages: rows.filter((r) => r.hreflang).length, robotsMeta: rows.filter((r) => r.robots).map((r) => `${r.path}: ${r.robots}`),
  h1Not1: rows.filter((r) => r.h1 !== 1).map((r) => `${r.path} (${r.h1})`),
  dupTitles: dup('title'), dupDescs: dup('desc'),
  toolWords: q(tools, (r) => r.words), toolsUnder300: tools.filter((r) => r.words < 300).map((r) => `${r.path} (${r.words})`), toolsUnder500: tools.filter((r) => r.words < 500).length,
  toolLinks: q(tools, (r) => r.toolLinks), toolsNoToolLink: tools.filter((r) => r.toolLinks === 0).map((r) => r.path),
  jsonldTypes: Object.entries(tools.flatMap((r) => r.jsonld).reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {})), toolsNoJsonld: tools.filter((r) => !r.jsonld.length).length,
};
fs.writeFileSync(out, JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1).slice(0, 12000));
