// Old instruction vs minimal-edit instruction vs LanguageTool, per language, from the bench.mjs result files:
// results-fr-es-de-it-ru-zh-ja-ar-hi-tr.json + results-pt.json (old instruction and LanguageTool, www, 26-27/09 evening)
// and results-minimal-*.json (new instruction, preview, LanguageTool not called again).
// A language passes when the new instruction is at least as good as the old on BOTH counts: exact >= and worse <=.
// Usage: node docs/audit/grammaire-multilingue/compare.mjs
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const read = (re) => Object.assign({}, ...fs.readdirSync(here).filter((f) => re.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'))));
const old = read(/^results-(pt|fr-.*)\.json$/), neu = read(/^results-minimal-.*\.json$/);
console.log('| Langue | Exactes : ancienne / nouvelle / LT | Empirées : ancienne / nouvelle / LT | Inchangées : nouvelle / LT | Nouvelle ≥ ancienne | Nouvelle face à LT |');
console.log('|---|---|---|---|---|---|');
for (const l of Object.keys(neu)) {
  const o = old[l]?.ours, n = neu[l].ours, t = old[l]?.languageTool;
  if (!o || !n) continue;
  const ok = n.exact >= o.exact && n.worse <= o.worse;
  const vsLt = t ? (n.exact >= t.exact && n.worse <= t.worse ? 'au moins aussi bien' : `en dessous (${n.exact < t.exact ? 'corrections' : ''}${n.exact < t.exact && n.worse > t.worse ? ' et ' : ''}${n.worse > t.worse ? 'phrases empirées' : ''})`) : 'pas de LT';
  console.log(`| ${l} | ${o.exact} / **${n.exact}** / ${t?.exact ?? '—'} | ${o.worse} / **${n.worse}** / ${t?.worse ?? '—'} | ${n.unchanged} / ${t?.unchanged ?? '—'} | ${ok ? 'oui' : '**NON**'} | ${vsLt} |`);
}
