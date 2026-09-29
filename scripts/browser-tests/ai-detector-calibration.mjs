// AI Detector calibration (30/09). The production detector asks gpt-4o-mini for its opinion ("is this AI?"); measured
// on www: it gave "70 % human" to AI-written text. The research alternative for a black-box model is RAIDAR (ICLR
// 2024, Mao et al.): ask the model to "Help me polish this" and measure how much it changes -- a model rewrites its
// own kind of text far less than human text. This script measures that on www, through the site's own AI route with
// the Chatbot's neutral instruction ("You are a helpful, friendly AI assistant…", the one the new detector sends) and
// RAIDAR's request "Help me polish this" (a first try through the Writer tool expanded every text: unusable), on a small corpus: human texts
// (Project Gutenberg, public domain; Wikipedia introductions; the owner's own French) and AI texts (generated here by
// the same model through the Writer tool, and texts written by Claude). Paid calls, a few cents in all.
// Usage: node scripts/browser-tests/ai-detector-calibration.mjs <origin> <dir with g1342.txt g74.txt g2701.txt g17489.txt w_*.json wf_*.json>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { raidarSimilarity, POLISH_PROMPT, cleanRewrite } from '../../lib/ai/raidar.js';
const origin = new URL(process.argv[2]).origin;
const dir = process.argv[3];
const words = (s, n) => s.replace(/\s+/g, ' ').trim().split(' ').slice(0, n).join(' ');
const from = (file, marker, n = 110) => { const t = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r/g, ''); const i = t.indexOf(marker); return words(t.slice(i), n); };
const wiki = (file, n = 110) => { const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); const p = Object.values(j.query.pages)[0]; return words(p.extract, n); };
const human = {
  'Austen 1813': from('g1342.txt', 'It is a truth universally'),
  'Twain 1876': from('g74.txt', 'No answer.', 110),
  'Melville 1851': from('g2701.txt', 'Call me Ishmael'),
  'Hugo 1862 (fr)': (() => { const t = fs.readFileSync(path.join(dir, 'g17489.txt'), 'utf8').replace(/\r/g, ''); const i = t.indexOf('En 1815'); return words(t.slice(i), 110); })(),
  'Lincoln 1863': 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live.',
  'Wikipedia Photosynthesis': wiki('w_Photosynthesis.json'),
  'Wikipedia Volcano': wiki('w_Volcano.json'),
  'Wikipedia Chess': wiki('w_Chess.json'),
  'Wikipedia Bicycle': wiki('w_Bicycle.json'),
  'Wikipédia Volcan (fr)': wiki('wf_Volcan.json'),
  'owner 30/09 (fr)': "Le propriétaire dort puis est occupé toute la journée : tu travailles seul jusqu'à la fin de ce prompt. Recherche des concurrents avant chaque choix, résultat au moins égal aux concurrents, décide toi-même, ne soumets aucun choix au propriétaire. Un message d'erreur honnête n'est pas une solution : l'outil doit fonctionner sur Safari iPhone et sur Safari Mac.",
};
const claude = {
  'Claude EN time management': "In today's fast-paced digital landscape, effective time management has become more important than ever. By leveraging proven strategies such as prioritization, time-blocking, and mindful breaks, individuals can significantly enhance their productivity. Furthermore, embracing digital tools can streamline workflows and reduce stress. Ultimately, mastering time management is not just about doing more; it is about creating a balanced, fulfilling life where both personal and professional goals can thrive.",
  'Claude FR gestion du temps': "À l'ère du numérique, la gestion efficace du temps est devenue un enjeu essentiel pour chacun. En adoptant des stratégies éprouvées, telles que la priorisation des tâches et la planification par blocs, il est possible d'améliorer considérablement sa productivité. Par ailleurs, les outils numériques permettent de simplifier les processus et de réduire le stress. En définitive, maîtriser son temps, c'est avant tout trouver un équilibre harmonieux entre vie personnelle et vie professionnelle.",
  'Claude EN remote work': "Remote work has fundamentally transformed the way organizations operate. While it offers employees greater flexibility and eliminates lengthy commutes, it also presents unique challenges, such as maintaining team cohesion and establishing clear boundaries between work and personal life. To thrive in this new environment, companies should invest in robust communication tools, foster a culture of trust, and prioritize regular check-ins. By doing so, they can unlock the full potential of a distributed workforce.",
};
const genTopics = ['Write one paragraph (about 100 words) explaining how photosynthesis works.', 'Write one paragraph (about 100 words) about why volcanoes erupt.', 'Write one paragraph (about 100 words) on the history of chess.', 'Write one paragraph (about 100 words) about the benefits of commuting by bicycle.', 'Écris un paragraphe (environ 100 mots) sur le métier de boulanger.', 'Écris un paragraphe (environ 100 mots) sur les volcans d\'Auvergne.'];
const b = await chromium.launch();
const page = await b.newPage();
await page.goto(origin + '/tools/ai-tools/ai-writer', { waitUntil: 'networkidle' });
const ai = async (prompt, tool = 'ai-chatbot') => page.evaluate(async ([p, t]) => { const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: p, tool: t }) }); const j = await r.json(); return j.text || ('ERROR ' + JSON.stringify(j)); }, [prompt, tool]);
// generated once (first run) and kept: the same AI texts for every run
const cached = fs.existsSync(path.join(dir, 'calibration.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'calibration.json'), 'utf8')).gen : null;
const gen = cached || {};
if (!cached) for (const [i, t] of genTopics.entries()) gen[`gpt-4o-mini #${i + 1}`] = (await ai(t, 'ai-writer')).trim();
const rows = [];
let calls = cached ? 0 : genTopics.length, chars = genTopics.join('').length;
for (const [kind, set] of [['human', human], ['ai', { ...claude, ...gen }]]) for (const [label, text] of Object.entries(set)) {
  const raw = (await ai(POLISH_PROMPT + text)).trim();
  if (raw.startsWith('ERROR')) { console.log('STOP: ' + raw); process.exit(2); }
  const polished = cleanRewrite(raw);
  calls++; chars += text.length * 2 + 40;
  const sim = raidarSimilarity(text, polished);
  rows.push({ kind, label, sim, len: text.length });
  console.log(`${kind.padEnd(5)} ${sim.toFixed(3)}  ${label}`);
}
fs.writeFileSync(path.join(dir, 'calibration.json'), JSON.stringify({ rows, gen }, null, 1));
const H = rows.filter((r) => r.kind === 'human').map((r) => r.sim), A = rows.filter((r) => r.kind === 'ai').map((r) => r.sim);
console.log(`human: min ${Math.min(...H).toFixed(3)} max ${Math.max(...H).toFixed(3)} · ai: min ${Math.min(...A).toFixed(3)} max ${Math.max(...A).toFixed(3)} · ${calls} calls, ~${((chars / 4) * 0.75 / 1e6).toFixed(4)} $`);
await b.close();
