// AI Detector evaluation (30/09): the CURRENT production detector (RAIDAR, lib/ai/raidar.js) measured on the corpus of
// scripts/ai-detector/corpus/, through the site's own AI route on www -- exactly what a visitor gets. Also generates
// the gpt-4o-mini part of the AI corpus (8 texts) with the Chatbot's neutral instruction, the way a visitor would ask.
// Paid calls (gpt-4o-mini, ~0.0002 $ each). The route allows 30 calls per hour and 100 per day per IP: the script
// keeps every answer in results/raidar-www.json and stops at the first refusal; run it again in the next UTC hour.
// Usage: node scripts/ai-detector/raidar-www.mjs [origin]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLISH_PROMPT, cleanRewrite, raidarSimilarity, raidarVerdict } from '../../lib/ai/raidar.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const origin = new URL(process.argv[2] || 'https://www.onlineconvertools.com').origin;
const corpusDir = path.join(here, 'corpus');
const outFile = path.join(here, 'results', 'raidar-www.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const state = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : { calls: [], rows: {} };
const save = () => fs.writeFileSync(outFile, JSON.stringify(state, null, 1));

const GPT_PROMPTS = [
  ['en', 'encyclopedia', 'Write a Wikipedia-style introduction about glaciers.'],
  ['en', 'blog', 'Write a short blog post about the pros and cons of working from home.'],
  ['en', 'fiction', 'Write a short scene: an old fisherman goes out to sea at dawn.'],
  ['en', 'abstract', 'Write the abstract of a research paper that proposes a new vision transformer for image classification.'],
  ['fr', 'encyclopedia', 'Écris une introduction de type encyclopédique sur les marées.'],
  ['fr', 'letter', "Écris une lettre à la mairie de ta commune pour demander une piste cyclable devant l'école. Signe simplement « Un parent d'élève »."],
  ['it', 'fiction', 'Scrivi una breve scena: un mercato in una piazza italiana al mattino.'],
  ['fr', 'fiction', 'Écris une courte scène : une boulangerie de village au petit matin.'],
];
const SUFFIX = ' One block of prose of 150-220 words, no title, no bullet points, no markdown.';

const b = await chromium.launch();
const page = await b.newPage();
await page.goto(origin + '/tools/ai-tools/ai-detector', { waitUntil: 'networkidle' });
const call = async (prompt, tool) => {
  const r = await page.evaluate(async ([p, t]) => {
    const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: p, tool: t }) });
    let j = null; try { j = await res.json(); } catch {}
    return { status: res.status, text: j && j.text, error: j && j.error };
  }, [prompt, tool]);
  state.calls.push({ at: new Date().toISOString(), tool, status: r.status, inChars: prompt.length, outChars: (r.text || '').length });
  save();
  if (r.status !== 200 || !r.text) { console.log(`STOP: HTTP ${r.status} ${r.error || ''} -- rerun in the next UTC hour`); await b.close(); process.exit(3); }
  return r.text;
};

// 1. gpt-4o-mini part of the AI corpus (generated once, kept)
const gptFile = path.join(corpusDir, 'ai-gpt4omini.json');
const gpt = fs.existsSync(gptFile) ? JSON.parse(fs.readFileSync(gptFile, 'utf8')) : [];
for (const [i, [lang, genre, prompt]] of GPT_PROMPTS.entries()) {
  const id = `ai-gpt4omini-${i + 1}`;
  if (gpt.some((x) => x.id === id)) continue;
  const text = (await call(prompt + SUFFIX, 'ai-chatbot')).trim();
  gpt.push({ id, lang, kind: 'ai', model: 'gpt-4o-mini', genre, prompt, text });
  fs.writeFileSync(gptFile, JSON.stringify(gpt, null, 1));
  console.log('generated', id, text.split(/\s+/).length, 'words');
}

// 2. RAIDAR on every text, exactly as the page does it
const all = fs.readdirSync(corpusDir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(path.join(corpusDir, f), 'utf8')));
// human and AI texts alternate, so a run cut by the hourly limit still measures both sides
const H = all.filter((t) => t.kind === 'human'), A = all.filter((t) => t.kind === 'ai');
const corpus = Array.from({ length: Math.max(H.length, A.length) }, (_, i) => [H[i], A[i]]).flat().filter(Boolean);
for (const t of corpus) {
  if (state.rows[t.id]) continue;
  const raw = await call(POLISH_PROMPT + t.text.trim(), 'ai-detector');
  const sim = raidarSimilarity(t.text, cleanRewrite(raw));
  state.rows[t.id] = { kind: t.kind, lang: t.lang, genre: t.genre, model: t.model || null, sim, verdict: raidarVerdict(sim) };
  save();
  console.log(`${t.kind.padEnd(5)} ${sim.toFixed(3)} ${raidarVerdict(sim).padEnd(9)} ${t.id}`);
}
const n = state.calls.length, inC = state.calls.reduce((s, c) => s + c.inChars, 0), outC = state.calls.reduce((s, c) => s + c.outChars, 0);
// gpt-4o-mini: 0.15 $ / 1M input tokens, 0.60 $ / 1M output tokens; ~4 characters per token (+ ~30 tokens of instruction)
console.log(`done: ${Object.keys(state.rows).length}/${corpus.length} texts; ${n} calls, ~${((inC / 4 + n * 30) * 0.15e-6 + (outC / 4) * 0.6e-6).toFixed(4)} $`);
await b.close();
