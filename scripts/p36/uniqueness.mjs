// P36: share of identical sentences between every pair of tool pages, on the text they really serve
// (scripts/p36/extract-content.mjs output). Sentences of the About text, steps, formats and limits, processing note,
// FAQ (questions and answers) and tips; headings and the "Related tools" links are common labels and are left out.
// Normalized: lower case, spaces and quotes unified, trailing punctuation dropped. For a pair (A, B):
// identical sentences / sentences of the shorter page. Also lists sentences found on 3 pages or more.
//   node scripts/p36/uniqueness.mjs <content.json> [--limit=0.30] [--json=out.json] [--only=/tools/pdf-tools/]
import fs from 'node:fs';

const [file, ...flags] = process.argv.slice(2);
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, '').split('=')));
const limit = Number(opt.limit || 0.3);
let rows = JSON.parse(fs.readFileSync(file, 'utf8')).filter((r) => r.about);
const norm = (s) => s.toLowerCase().replace(/[“”«»"]/g, '"').replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').replace(/[.!?:;,\s]+$/, '').trim();
const split = (t) => (t || '').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).map(norm).filter((s) => s.split(' ').length >= 3);
export function sentencesOf(r) {
  const parts = [r.about?.text, ...(r.howto || []), ...(r.faq || []).flatMap((x) => [x.q, x.a]), ...(r.tips || [])];
  for (const [k, v] of Object.entries(r)) if (v && typeof v === 'object' && !Array.isArray(v) && v.heading && !['about', 'example'].includes(k)) parts.push(v.text);
  return new Set(parts.flatMap(split));
}
const sets = rows.map((r) => ({ path: r.path, s: sentencesOf(r) }));
const count = new Map();
for (const { path, s } of sets) for (const x of s) count.set(x, [...(count.get(x) || []), path]);
const pairs = [];
for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
  const a = sets[i], b = sets[j];
  let shared = 0;
  for (const x of a.s) if (b.s.has(x)) shared++;
  if (!shared) continue;
  const ratio = shared / Math.min(a.s.size, b.s.size);
  pairs.push({ a: a.path, b: b.path, shared, ratio: Math.round(ratio * 1000) / 1000 });
}
pairs.sort((x, y) => y.ratio - x.ratio);
const over = pairs.filter((p) => p.ratio > limit);
const repeated = [...count.entries()].filter(([, v]) => v.length >= 3).sort((x, y) => y[1].length - x[1].length);
const only = opt.only ? (p) => p.a.startsWith(opt.only) || p.b.startsWith(opt.only) : () => true;
console.log(`${sets.length} pages, ${pairs.length} pairs sharing at least one sentence; max ${pairs[0]?.ratio ?? 0}; pairs over ${limit * 100} %: ${over.length}`);
for (const p of over.filter(only).slice(0, 40)) console.log(`  ${(p.ratio * 100).toFixed(1)} %  ${p.a}  ${p.b}  (${p.shared})`);
console.log(`sentences on 3+ pages: ${repeated.length}`);
for (const [s, v] of repeated.slice(0, 25)) console.log(`  ${v.length}× ${s.slice(0, 110)}`);
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ pages: sets.length, max: pairs[0]?.ratio ?? 0, over, top: pairs.slice(0, 100), repeated: repeated.map(([s, v]) => ({ s, pages: v })) }, null, 1));
process.exitCode = over.filter(only).length ? 1 : 0;
