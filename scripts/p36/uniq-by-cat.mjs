// P36: highest identical-sentence share between a page of each category and any other page (same measure as uniqueness.mjs).
//   node scripts/p36/uniq-by-cat.mjs <content.json>
import fs from 'node:fs';
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).filter((r) => r.about);
const norm = (s) => s.toLowerCase().replace(/[“”«»"]/g, '"').replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').replace(/[.!?:;,\s]+$/, '').trim();
const split = (t) => (t || '').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).map(norm).filter((s) => s.split(' ').length >= 3);
const sets = rows.map((r) => { const parts = [r.about?.text, ...(r.howto || []), ...(r.faq || []).flatMap((x) => [x.q, x.a]), ...(r.tips || [])]; for (const [k, v] of Object.entries(r)) if (v && typeof v === 'object' && !Array.isArray(v) && v.heading && !['about', 'example'].includes(k)) parts.push(v.text); return { cat: r.path.split('/')[2], s: new Set(parts.flatMap(split)) }; });
const best = {};
for (let i = 0; i < sets.length; i++) for (let j = 0; j < sets.length; j++) { if (i === j) continue; let sh = 0; for (const x of sets[i].s) if (sets[j].s.has(x)) sh++; const r = sh / Math.max(1, Math.min(sets[i].s.size, sets[j].s.size)); best[sets[i].cat] = Math.max(best[sets[i].cat] || 0, r); }
for (const [c, v] of Object.entries(best).sort()) console.log(c, (v * 100).toFixed(1) + ' %');
