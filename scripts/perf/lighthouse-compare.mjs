// Before/after table per page template from two outputs of lighthouse-pages.mjs (medians, and the worst page).
//   node scripts/perf/lighthouse-compare.mjs <before.json> <after.json>
import fs from 'node:fs';

const [before, after] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const template = (u) => {
  const p = new URL(u).pathname.replace(/\/$/, '') || '/';
  if (p === '/') return 'Accueil';
  if (p === '/tools') return 'Liste des outils';
  if (/^\/tools\/[^/]+$/.test(p)) return 'Catégorie (12)';
  if (/^\/tools\/[^/]+\/[^/]+$/.test(p)) return 'Outil (225)';
  return 'Pages du site (about, privacy, terms, contact)';
};
const median = (a) => { const s = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const group = (rows) => {
  const g = {};
  for (const r of rows) { if (r.error || !r.scores) continue; (g[template(r.url)] ||= []).push(r); }
  return g;
};
const stats = (rows) => ({
  n: rows.length,
  perf: median(rows.map((r) => r.scores.performance)), a11y: median(rows.map((r) => r.scores.accessibility)),
  bp: median(rows.map((r) => r.scores['best-practices'])), seo: median(rows.map((r) => r.scores.seo)),
  lcp: median(rows.map((r) => r.lcp)), cls: median(rows.map((r) => r.cls)), tbt: median(rows.map((r) => r.tbt)),
  js: median(rows.map((r) => r.js && Math.round(r.js.bytes / 1024))), total: median(rows.map((r) => r.totalBytes && Math.round(r.totalBytes / 1024))),
  worstPerf: Math.min(...rows.map((r) => r.scores.performance)), maxCls: Math.max(...rows.map((r) => r.cls || 0)),
});
const B = group(before), A = group(after);
const fmt = (b, a, unit = '', better = 'up') => (b === null || a === null ? '—' : `${b}${unit} → **${a}${unit}**`);
console.log('| Gabarit | Pages | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | JS transféré | Poids total | Pire performance | Pire CLS |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const t of ['Accueil', 'Liste des outils', 'Catégorie (12)', 'Outil (225)', 'Pages du site (about, privacy, terms, contact)']) {
  if (!B[t] || !A[t]) continue;
  const b = stats(B[t]), a = stats(A[t]);
  console.log(`| ${t} | ${a.n} | ${fmt(b.perf, a.perf)} | ${fmt(b.a11y, a.a11y)} | ${fmt(b.bp, a.bp)} | ${fmt(b.seo, a.seo)} | ${fmt((b.lcp / 1000).toFixed(1), (a.lcp / 1000).toFixed(1), ' s')} | ${fmt(b.cls, a.cls)} | ${fmt(b.tbt, a.tbt, ' ms')} | ${fmt(b.js, a.js, ' Ko')} | ${fmt(b.total, a.total, ' Ko')} | ${fmt(b.worstPerf, a.worstPerf)} | ${fmt(b.maxCls, a.maxCls)} |`);
}
// Failing audits, counted over all pages
const count = (rows) => { const c = {}; for (const r of rows) for (const [k, v] of Object.entries(r.failing || {})) for (const id of v) c[`${k}:${id}`] = (c[`${k}:${id}`] || 0) + 1; return c; };
const cb = count(before), ca = count(after);
console.log('\n| Audit en échec (hors performance) | Pages avant | Pages après |');
console.log('|---|---|---|');
for (const k of [...new Set([...Object.keys(cb), ...Object.keys(ca)])].sort((x, y) => (cb[y] || 0) - (cb[x] || 0))) console.log(`| ${k} | ${cb[k] || 0} | ${ca[k] || 0} |`);
const errs = after.filter((r) => r.error).length;
if (errs) console.log(`\n${errs} page(s) sans rapport dans « après »`);
