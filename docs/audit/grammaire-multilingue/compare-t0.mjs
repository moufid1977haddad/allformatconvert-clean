// Temperature 0 vs the default temperature, per language, with the chance measured on both sides:
//  - production instruction ("fix all errors", default temperature): results-fr-…json + results-pt.json (26-27/09, www)
//    and results-prod2-*.json (a second run, 28/09, www) -> its run-to-run spread;
//  - minimal-edit instruction, default temperature: results-minimal-*.json (27/09, preview);
//  - minimal-edit instruction, temperature 0: results-t0-run1-*.json and results-t0-run2-*.json (28/09, preview);
//  - LanguageTool: from the 26-27/09 files (not called again).
// A language passes when EVERY temperature-0 run is at least as good as the BEST production run on both counts
// (exact >= and worse <=) — the owner's condition, "at least as good in each language", made strict.
// Usage: node docs/audit/grammaire-multilingue/compare-t0.mjs
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const read = (re) => Object.assign({}, ...fs.readdirSync(here).filter((f) => re.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'))));
const prod1 = read(/^results-(pt|fr-.*)\.json$/), prod2 = read(/^results-prod2-.*\.json$/), minT = read(/^results-minimal-.*\.json$/);
const t1 = read(/^results-t0-run1-.*\.json$/), t2 = read(/^results-t0-run2-.*\.json$/);
const f = (r) => (r ? `${r.exact}/${r.worse}` : '—');
console.log('| Langue | Production 1 | Production 2 | Minimale, temp. défaut | **Minimale T0 n° 1** | **Minimale T0 n° 2** | LanguageTool | T0 ≥ meilleure production ? | T0 face à LT |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const l of ['pt', 'de', 'ar', 'ja', 'zh', 'tr', 'hi', 'es', 'it', 'ru']) {
  const p1 = prod1[l]?.ours, p2 = prod2[l]?.ours, m = minT[l]?.ours, a = t1[l]?.ours, b = t2[l]?.ours, lt = prod1[l]?.languageTool;
  const prods = [p1, p2].filter(Boolean), runs = [a, b].filter(Boolean);
  const bestExact = Math.max(...prods.map((r) => r.exact)), bestWorse = Math.min(...prods.map((r) => r.worse));
  const ok = runs.length ? runs.every((r) => r.exact >= bestExact && r.worse <= bestWorse) : null;
  const okAny = runs.length ? runs.every((r) => prods.some((p) => r.exact >= p.exact && r.worse <= p.worse)) : null;
  const vsLt = !lt || !runs.length ? 'pas de LT' : runs.every((r) => r.exact >= lt.exact && r.worse <= lt.worse) ? 'au moins aussi bien' : `en dessous (empirées ${runs.map((r) => r.worse).join(', ')} contre ${lt.worse})`;
  console.log(`| ${l} | ${f(p1)} | ${f(p2)} | ${f(m)} | **${f(a)}** | **${f(b)}** | ${f(lt)} | ${ok === null ? '—' : ok ? 'oui' : okAny ? 'dans la marge de la production' : '**NON**'} | ${vsLt} |`);
}
console.log('\nCellules : phrases exactes / phrases empirées, sur 40.');
