// P36: words of the SEO block per page and per category (median, min, max) from an extract-content.mjs JSON.
//   node scripts/p36/word-stats.mjs <content.json> [--json=out.json]
import fs from 'node:fs';
const [file, ...flags] = process.argv.slice(2);
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, '').split('=')));
const rows = JSON.parse(fs.readFileSync(file, 'utf8')).filter((r) => r.about);
const by = {};
for (const r of rows) (by[r.path.split('/')[2]] ||= []).push(r.seoWords);
const out = {};
for (const [c, v] of Object.entries(by).sort()) { v.sort((a, b) => a - b); out[c] = { pages: v.length, median: v[Math.floor(v.length / 2)], min: v[0], max: v[v.length - 1], under300: v.filter((x) => x < 300).length }; console.log(c.padEnd(18), JSON.stringify(out[c])); }
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ byCategory: out, pages: Object.fromEntries(rows.map((r) => [r.path, r.seoWords])) }, null, 1));
