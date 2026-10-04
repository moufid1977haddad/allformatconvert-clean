// P32 (04/10) — the bench table (markdown) from docs/audit/p32-bg/mesures-p32.json, variant "p31" (the page today)
// or another one, and per case whether each fal model is better / worse than IS-Net (alpha error, edge leak, background
// kept, subject cut; a difference counts when > 10 % relative AND > 0.2 absolute for %, 0.1 for the alpha error).
// Usage: node scripts/p32/bg/table.mjs [variant=p31] [falVariant=same]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..');
const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'audit', 'p32-bg', 'mesures-p32.json'), 'utf8'));
const V = process.argv[2] || 'p31', FV = process.argv[3] || V;
const f = (x, d = 2) => (x === undefined ? '-' : Number(x).toFixed(d).replace('.', ','));
const worse = (a, b, abs) => b - a > abs && b > a * 1.1; // b worse than a (lower is better)
const KEYS = [['alphaMAE', 0.1], ['bgLeakPct', 0.2], ['fondGardePct', 0.2], ['sujetPerduPct', 0.2]];

console.log(`| Photo | IS-Net : bord % / α / fond gardé % / sujet perdu % | BRIA | BiRefNet | BRIA vs IS-Net | BiRefNet vs IS-Net |`);
console.log('|---|---|---|---|---|---|');
const tally = { bria: { better: [], worse: [], mixed: [], same: [] }, birefnet: { better: [], worse: [], mixed: [], same: [] } };
for (const r of J.cases) {
  if (r.case === 'IMG_2433') continue;
  const cell = (m, v) => { const x = r[m][v]; return `${f(x.bgLeakPct)} / ${f(x.alphaMAE)} / ${f(x.fondGardePct)} / ${f(x.sujetPerduPct)}`; };
  const cmp = (m) => {
    const a = r.isnet[V], b = r[m][FV];
    const w = KEYS.filter(([k, abs]) => worse(a[k], b[k], abs)).map(([k]) => k), bt = KEYS.filter(([k, abs]) => worse(b[k], a[k], abs)).map(([k]) => k);
    const verdict = w.length && bt.length ? 'mixed' : w.length ? 'worse' : bt.length ? 'better' : 'same';
    tally[m][verdict].push(r.case);
    return { verdict, txt: verdict === 'same' ? 'égal' : `${bt.length ? 'mieux : ' + bt.join(', ') : ''}${bt.length && w.length ? ' ; ' : ''}${w.length ? 'PIRE : ' + w.join(', ') : ''}` };
  };
  console.log(`| ${r.case} | ${cell('isnet', V)} | ${cell('bria', FV)} | ${cell('birefnet', FV)} | ${cmp('bria').txt} | ${cmp('birefnet').txt} |`);
}
const m = J.means;
const mc = (k) => { const x = m[k]; return x ? `${f(x.bgLeakPct)} / ${f(x.alphaMAE)} / ${f(x.fondGardePct)} / ${f(x.sujetPerduPct)}` : '-'; };
console.log(`| **moyenne ${m.nGtCases} cas** | ${mc('isnet/' + V)} | ${mc('bria/' + FV)} | ${mc('birefnet/' + FV)} | | |`);
console.log('\nTally', JSON.stringify(Object.fromEntries(Object.entries(tally).map(([k, t]) => [k, Object.fromEntries(Object.entries(t).map(([a, b]) => [a, b.length]))]))));
console.log(JSON.stringify(tally, null, 1));
const o = J.cases.find((r) => r.case === 'IMG_2433');
if (o) for (const mm of ['isnet', 'bria', 'birefnet']) for (const v of Object.keys(o[mm]).filter((k) => typeof o[mm][k] === 'object')) console.log('IMG_2433', mm, v, JSON.stringify(o[mm][v]));
