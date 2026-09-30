// Pangram on the AI Detector corpus -- to run ONLY once the owner has a Pangram key (not done on 30/09: an account
// is required and none was created). Cost: $0.05 per started 100 words, i.e. about 97 texts x $0.10 = ~$10 for the
// whole corpus (texts of 80-240 words). Answers are kept in results/pangram.json; texts already measured are skipped.
// Usage (PowerShell, key loaded without being displayed -- plan-de-travail.md annexe B):
//   node scripts/ai-detector/pangram-corpus.mjs
// then: python scripts/ai-detector/summarize.py scripts/ai-detector/results/pangram.json fraction_ai 0.5
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePangramKey, detectWithPangram } from '../../lib/ai/pangram.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const apiKey = requirePangramKey();
const outFile = path.join(here, 'results', 'pangram.json');
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
const corpus = fs.readdirSync(path.join(here, 'corpus')).filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(here, 'corpus', f), 'utf8')));
for (const t of corpus) {
  if (out[t.id]) continue;
  const r = await detectWithPangram(t.text, { apiKey });
  out[t.id] = { kind: t.kind, lang: t.lang, genre: t.genre, model: t.model || null, fraction_ai: r.fractionAi + r.fractionAiAssisted, verdict: r.verdict };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  console.log(t.kind.padEnd(5), r.verdict.padEnd(6), r.fractionAi.toFixed(2), t.id);
}
