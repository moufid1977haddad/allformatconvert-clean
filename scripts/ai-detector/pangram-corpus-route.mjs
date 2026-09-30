// P17: the 97-text corpus measured with Pangram THROUGH THE SITE'S ROUTE on a Vercel preview (the key exists only in
// Vercel). Budget authorised by the owner: at most $10 of Pangram credits. Texts over 190 words are cut at the last
// sentence ending before 190 words, so each costs 2 credits at most (Pangram bills per started 100 words; 190 leaves a
// margin in case Pangram counts a few more words than we do): 188 credits = $9.40 for the corpus. The script stops
// before its running estimate passes $9.50. Answers kept in results/pangram-preview.json; measured texts are skipped.
// Usage: node scripts/ai-detector/pangram-corpus-route.mjs http://localhost:3200   (vercel-preview-proxy.mjs relay)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countBillableWords, pangramCostMicros } from '../../lib/ai/pangram.js';

const origin = process.argv[2];
if (!origin) { console.error('usage: pangram-corpus-route.mjs <origin>'); process.exit(1); }
const CUT = 190;
const STOP_MICROS = 9_500_000;
const here = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(here, 'results', 'pangram-preview.json');
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};

export function cutText(text, max = CUT) {
  if (countBillableWords(text) <= max) return text;
  const sentences = text.match(/[^.!?…]+[.!?…]+["»”)\]]*\s*/g) || [];
  let o = '';
  for (const s of sentences) { if (countBillableWords(o + s) > max) break; o += s; }
  if (!o.trim()) throw new Error('no sentence fits under ' + max + ' words');
  return o.trim();
}

const corpus = fs.readdirSync(path.join(here, 'corpus')).filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(here, 'corpus', f), 'utf8')));
let spent = Object.values(out).reduce((a, r) => a + (r.costMicros || 0), 0);
for (const t of corpus) {
  if (out[t.id]) continue;
  const text = cutText(t.text);
  const words = countBillableWords(text);
  const cost = pangramCostMicros(words);
  if (spent + cost > STOP_MICROS) { console.log(`STOP before ${t.id}: estimate would pass $${STOP_MICROS / 1e6}`); break; }
  const res = await fetch(origin + '/api/ai-detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  const j = await res.json().catch(() => ({ error: 'unreadable HTTP ' + res.status }));
  if (!res.ok) { console.log('HTTP', res.status, t.id, j.error); if (res.status >= 500 && res.status !== 503) spent += cost; break; }
  spent += cost;
  out[t.id] = { kind: t.kind, lang: t.lang, genre: t.genre, model: t.model || null, words, cut: text !== t.text, costMicros: cost,
    verdict: j.verdict, fractionAi: j.fractionAi, fractionAiAssisted: j.fractionAiAssisted, fractionHuman: j.fractionHuman, version: j.version };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  console.log(t.kind.padEnd(5), String(j.verdict).padEnd(6), (j.fractionAi ?? NaN).toFixed(2), words, t.id, `$${(spent / 1e6).toFixed(2)}`);
}
console.log(`measured ${Object.keys(out).length}/${corpus.length}, estimated spend $${(spent / 1e6).toFixed(2)}`);
