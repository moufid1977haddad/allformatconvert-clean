// P36 lot 2: docs/audit/AUDIT-TEXTES-P36.md from the 14 auditors' tables (docs/audit/p36/audit/<lot>.md), the served
// text (docs/audit/p36/contenu-avant.json, read on www) and the uniqueness measure (unicite-avant.json).
// Counts one defect per table row whose "Type" cell names a type; repeated sentences and thin pages are measured here.
//   node scripts/p36/compile-audit.mjs
import fs from 'node:fs';
import path from 'node:path';

const D = 'docs/audit/p36';
const TYPES = ['FAUX', 'INVÉRIFIABLE', 'TROMPEUR', 'GÉNÉRIQUE', 'MINCE', 'LIBELLÉ', 'FORMAT'];
const lots = JSON.parse(fs.readFileSync(`${D}/lots.json`, 'utf8'));
const content = JSON.parse(fs.readFileSync(`${D}/contenu-avant.json`, 'utf8'));
const uniq = JSON.parse(fs.readFileSync(`${D}/unicite-avant.json`, 'utf8'));
const words = JSON.parse(fs.readFileSync(`${D}/mots-avant.json`, 'utf8'));

const perLot = {};
const total = Object.fromEntries(TYPES.map((t) => [t, 0]));
const perTool = {};
for (const lot of Object.keys(lots)) {
  const md = fs.readFileSync(`${D}/audit/${lot}.md`, 'utf8');
  const counts = Object.fromEntries(TYPES.map((t) => [t, 0]));
  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || /^\|\s*-/.test(line) || /\|\s*Type\s*\|/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim());
    const type = cells.find((c) => TYPES.includes(c.replace(/\*/g, '')));
    if (!type || cells.length < 8) continue; // defect rows have 6 columns; summary tables ("| FAUX | 10 |") are not defects
    const t = type.replace(/\*/g, '');
    counts[t]++; total[t]++;
    const tool = cells[1];
    perTool[tool] = (perTool[tool] || 0) + 1;
  }
  perLot[lot] = counts;
}
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

let out = `# AUDIT DES TEXTES — P36 lot 2 (06/10) : ce qui doit disparaître

Lecture seule, **avant toute réécriture**. Texte servi relu **sur www** le 05/10 au soir (\`scripts/p36/extract-content.mjs\`,
HTML brut, 225 pages, \`docs/audit/p36/contenu-avant.json\`) ; chaque affirmation confrontée au code par 14 auditeurs
(sous-agents, un lot chacun, consignes \`docs/audit/p36/CONSIGNES-AUDIT-LOT2.md\`), avec fichier:ligne. Tableaux complets par
lot : \`docs/audit/p36/audit/<lot>.md\` ; fiches de faits (libellés, formats, limites, lieu de traitement) :
\`docs/audit/p36/faits/<lot>.json\`.

Types : **FAUX** (contredit par le code), **INVÉRIFIABLE** (aucune preuve), **TROMPEUR** (vrai seulement en partie),
**GÉNÉRIQUE** (phrase copiable sur une autre page), **MINCE** (information propre manquante), **LIBELLÉ** (bouton cité
inexistant ou mal nommé), **FORMAT** (format annoncé non accepté, ou accepté et non dit).

## 1. Défauts par lot

| Lot | Outils | ${TYPES.join(' | ')} | Total |
|---|---|${TYPES.map(() => '---').join('|')}|---|
`;
for (const [lot, c] of Object.entries(perLot)) out += `| ${lot} | ${lots[lot].length} | ${TYPES.map((t) => c[t]).join(' | ')} | **${sum(c)}** |\n`;
out += `| **Total** | **225** | ${TYPES.map((t) => `**${total[t]}**`).join(' | ')} | **${sum(total)}** |\n`;

out += `\n## 2. Passages dupliqués entre pages (mesure \`scripts/p36/uniqueness.mjs\`, phrases identiques)

- Paires de pages partageant au moins une phrase : ${uniq.top.length ? '' : '0'}${(uniq.over || []).length} paires **au-delà de 30 %** de phrases identiques ; maximum **${(uniq.max * 100).toFixed(1)} %**.
- Phrases présentes sur 3 pages ou plus : **${uniq.repeated.length}**.

| Part identique | Page A | Page B |
|---|---|---|
`;
for (const p of uniq.over) out += `| ${(p.ratio * 100).toFixed(1)} % | ${p.a} | ${p.b} |\n`;
out += `\nPhrases les plus répétées (toutes disparaissent à la réécriture) :\n\n| Pages | Phrase |\n|---|---|\n`;
for (const r of uniq.repeated.slice(0, 40)) out += `| ${r.pages.length} | ${r.s.replace(/\|/g, '\\|').slice(0, 160)} |\n`;

out += `\n## 3. Textes trop minces (bloc de contenu < 300 mots, liens « Related tools » compris)\n\n| Catégorie | Pages | Médiane | Min | Max | < 300 mots |\n|---|---|---|---|---|---|\n`;
for (const [c, s] of Object.entries(words.byCategory)) out += `| ${c} | ${s.pages} | ${s.median} | ${s.min} | ${s.max} | ${s.under300} |\n`;
const thin = Object.entries(words.pages).filter(([, w]) => w < 300).sort((a, b) => a[1] - b[1]);
out += `\n${thin.length} pages : ${thin.map(([p, w]) => `${p.replace('/tools/', '')} (${w})`).join(', ')}.\n`;
out += `\nLe nombre de mots n'est pas le critère principal (gabarit §2c : 350-700 mots, moins plutôt que du remplissage) ; une page
est **MINCE** dans les tableaux ci-dessous quand l'information propre à l'outil manque (formats, limites, réglages, cas non pris en charge).\n`;

out += `\n## 4. Tableaux complets, lot par lot\n`;
for (const lot of Object.keys(lots)) {
  const md = fs.readFileSync(`${D}/audit/${lot}.md`, 'utf8').replace(/^# .*\n/, '');
  out += `\n---\n\n### Lot ${lot}\n${md.replace(/^## /gm, '#### ')}\n`;
}
fs.writeFileSync('docs/audit/AUDIT-TEXTES-P36.md', out);
console.log(JSON.stringify({ total: sum(total), byType: total, perLot: Object.fromEntries(Object.entries(perLot).map(([k, v]) => [k, sum(v)])) }));
