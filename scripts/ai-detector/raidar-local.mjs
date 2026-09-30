// AI Detector evaluation (30/09), LOCAL: the current detector (RAIDAR) on the rest of the corpus, calling OpenAI
// directly with exactly the request /api/ai sends for tool "ai-detector" (gpt-4o-mini, max_tokens 1000, the
// Chatbot's instruction from lib/ai/toolPrompts.js, POLISH_PROMPT + text) -- without the site's quota layer, so no
// Supabase counter is touched. The key is read by Next's own env loader (@next/env, as `next build` does) and never
// printed. On 30/09 the local OPENAI_API_KEY is DEFINED BUT EMPTY (Vercel returns secret variables empty to
// `vercel env pull`): the script then stops at once. The owner can set it in .env.local himself and run:
//   node scripts/ai-detector/raidar-local.mjs
// Answers go to results/raidar-www.json (same file: the gpt-4o-mini call is identical), WITH the rewrite this time,
// so the share of prose changed can be studied (cause of the arXiv 2016 false positive). Stops before 1 $ in total.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { POLISH_PROMPT, cleanRewrite, raidarSimilarity, raidarVerdict } from '../../lib/ai/raidar.js';
import { resolveTextTool } from '../../lib/ai/toolPrompts.js';

const here = path.dirname(fileURLToPath(import.meta.url));
nextEnv.loadEnvConfig(path.resolve(here, '../..'), false, { info() {}, error() {} });
const key = process.env.OPENAI_API_KEY;
if (!key) { console.error('STOP: OPENAI_API_KEY is empty or missing in the local environment (value never printed).'); process.exit(2); }
const BUDGET_DOLLARS = 1;
const outFile = path.join(here, 'results', 'raidar-www.json');
const state = JSON.parse(fs.readFileSync(outFile, 'utf8'));
const spent = () => state.calls.reduce((s, c) => s + (c.costDollars ?? ((c.inChars / 4 + 30) * 0.15e-6 + (c.outChars / 4) * 0.6e-6)), 0);
const resolved = resolveTextTool({ tool: 'ai-chatbot' }); // same instruction the removed 'ai-detector' entry had (P17)
if (!resolved.ok) throw new Error(resolved.error);
const corpus = fs.readdirSync(path.join(here, 'corpus')).filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(here, 'corpus', f), 'utf8')));
for (const t of corpus) {
  if (state.rows[t.id]) continue;
  if (spent() > BUDGET_DOLLARS - 0.01) { console.log('STOP: budget of 1 $ reached'); break; }
  const prompt = POLISH_PROMPT + t.text.trim();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1000, ...(resolved.temperature === undefined ? {} : { temperature: resolved.temperature }),
      messages: [{ role: 'system', content: resolved.system }, { role: 'user', content: prompt }] }),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.choices?.[0]?.message?.content) { console.log('STOP: OpenAI HTTP ' + res.status + ' ' + (j?.error?.code || '')); break; }
  const u = j.usage || {};
  const rewrite = cleanRewrite(j.choices[0].message.content);
  state.calls.push({ at: new Date().toISOString(), tool: 'ai-detector (local, direct)', status: 200, inChars: prompt.length, outChars: rewrite.length,
    costDollars: (u.prompt_tokens || 0) * 0.15e-6 + (u.completion_tokens || 0) * 0.6e-6 });
  const sim = raidarSimilarity(t.text, rewrite);
  state.rows[t.id] = { kind: t.kind, lang: t.lang, genre: t.genre, model: t.model || null, sim, verdict: raidarVerdict(sim), rewrite, via: 'local' };
  fs.writeFileSync(outFile, JSON.stringify(state, null, 1));
  console.log(`${t.kind.padEnd(5)} ${sim.toFixed(3)} ${raidarVerdict(sim).padEnd(9)} ${t.id}`);
}
console.log(`measured ${Object.keys(state.rows).length}/${corpus.length}; spent so far ~${spent().toFixed(4)} $`);
