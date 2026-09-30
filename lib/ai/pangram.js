// Pangram AI-text detection (docs/audit/RAPPORT-ai-detector-30-09.md, RAPPORT-p17-30-09.md) -- the AI Detector's engine
// since P17. Spending is bounded by lib/quota/aiDetect.js (own $50 monthly budget, 2,000 words per visitor per day).
// Chosen on 30/09 because no zero-cost method measured on our corpus reached the market's level without calling
// human texts AI (RAIDAR, 3 open classifiers, Binoculars / Fast-DetectGPT with Qwen2.5), while Pangram is the
// detector with the lowest false-positive rate in the independent studies (Jabarian & Imas, NBER w34223, 2025) and
// supports French. Paid per word; without PANGRAM_API_KEY the route refuses loudly.
// API read on docs.pangram.com (29/09/2026): POST https://text.external-api.pangram.com/task {text, model} with the
// x-api-key header, then GET /task/{task_id} until stage is STAGE_SUCCESS or STAGE_FAILED; result v4.0 gives
// prediction_short ("AI" | "Human" | "Mixed"), fraction_ai, fraction_ai_assisted, fraction_human, headline, windows.

export const PANGRAM_ENDPOINT = 'https://text.external-api.pangram.com/task';
export const PANGRAM_MODEL = 'pangram-4';
// Price read on pangram.com/knowledge-hub/what-is-pangrams-developers-plan (29/09/2026): $0.05 per 100 words,
// pay as you go. Billed words are rounded UP to the next 100 here (conservative until an invoice shows otherwise).
export const PANGRAM_MICROS_PER_100_WORDS = 50_000; // $0.05
// Longest text accepted per analysis: 1,000 words = at most $0.50 (GPTZero's free web tier checks up to 10,000
// words a month, Pangram's 2,000 a day; a 1,000-word cap covers an essay page).
export const AI_DETECT_MAX_WORDS = 1000;
export const AI_DETECT_MIN_WORDS = 40;
// Free words per visitor per UTC day, enforced by lib/quota/aiDetect.js (must equal AI_DETECT_WORDS_PER_IP_PER_DAY
// there, checked by scripts/converter-tests/15-ai-detector-pangram.mjs): Pangram's own free allowance.
export const AI_DETECT_FREE_WORDS_PER_DAY = 2000;

export function countWords(text) {
  const t = String(text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

// Longest text in characters, whatever the word count (1,000 long words stay bounded too).
export const AI_DETECT_MAX_CHARS = 12000;
// Pangram does not say how it counts words, and a word counted too low here is money spent past the budget (review
// P17). So the count is the HIGHEST of three readings, never fewer words than Pangram could bill:
//   1. whitespace-separated tokens (how "per 100 words" reads for ordinary text);
//   2. runs of letters and digits, invisible characters (zero-width space, joiners, BOM, soft hyphen) removed first --
//      "a<ZWSP>b<ZWSP>c" or "ab-ab-ab" cannot pass as one word; an apostrophe keeps "don't" / "l'été" together;
//   3. one word per 8 characters (ordinary English or French runs 5.5-7 characters per word, spaces included), so a
//      few very long "words" cannot carry a long text either;
// and, in scripts written without spaces (Chinese, Japanese, Thai, Lao, Khmer, Burmese, Tibetan, Javanese, Balinese),
// each character counts as one word.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Tibetan}\p{Script=Javanese}\p{Script=Balinese}]/gu;
const INVISIBLE = /[­᠎​-‏‪-‮⁠-⁤﻿]/g;
const RUN = /[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+)*/gu;
export const CHARS_PER_BILLABLE_WORD = 8;
export function countBillableWords(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  const unspaced = (t.match(UNSPACED) || []).length;
  const rest = t.replace(UNSPACED, ' ');
  const tokens = rest.split(/\s+/).filter(Boolean).length;
  const runs = (rest.replace(INVISIBLE, ' ').match(RUN) || []).length;
  const byLength = Math.ceil(t.length / CHARS_PER_BILLABLE_WORD);
  return Math.max(unspaced + Math.max(tokens, runs), byLength);
}

// Billed words: Pangram rounds each scan UP to the next 100 words (1 credit = 100 words, knowledge hub, 30/09/2026).
export function billedWords(words) {
  return Math.max(1, Math.ceil(words / 100)) * 100;
}

export function pangramCostMicros(words) {
  return Math.max(1, Math.ceil(words / 100)) * PANGRAM_MICROS_PER_100_WORDS;
}

// No silent fallback: without the key the detector does not exist, and says so.
export function requirePangramKey(env = process.env) {
  const key = env.PANGRAM_API_KEY;
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('[ai-detect] PANGRAM_API_KEY is not set: the Pangram detector is not in service (docs/audit/RAPPORT-ai-detector-30-09.md).');
  }
  return key.trim();
}

const VERDICTS = { AI: 'ai', Human: 'human', Mixed: 'mixed' };

export function readPangramResult(j) {
  const verdict = VERDICTS[j && j.prediction_short];
  const num = (x) => (typeof x === 'number' && x >= 0 && x <= 1 ? x : null);
  if (!verdict || num(j.fraction_ai) === null || num(j.fraction_human) === null) {
    throw new Error('[ai-detect] unexpected Pangram result: ' + JSON.stringify(j && { stage: j.stage, prediction_short: j.prediction_short, version: j.version }));
  }
  return {
    verdict,
    fractionAi: j.fraction_ai,
    fractionAiAssisted: num(j.fraction_ai_assisted) ?? 0,
    fractionHuman: j.fraction_human,
    headline: typeof j.headline === 'string' ? j.headline : '',
    version: j.version || null,
  };
}

// One analysis: create the task, then read it until it has finished (bounded: ~30 s at most, inside this request).
/** @param {string} text
 *  @param {{ apiKey: string, fetchImpl?: typeof fetch, pollMs?: number, maxPolls?: number, requestMs?: number, totalMs?: number, sleep?: (ms: number) => Promise<unknown> }} opts */
export async function detectWithPangram(text, { apiKey, fetchImpl = fetch, pollMs = 500, maxPolls = 60, requestMs = 10_000, totalMs = 45_000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
  // Each request is bounded (a hung connection cannot hold the function until Vercel kills it), and so is the whole.
  const deadline = Date.now() + totalMs;
  const signal = () => AbortSignal.timeout(Math.max(1000, Math.min(requestMs, deadline - Date.now())));
  const created = await fetchImpl(PANGRAM_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ text, model: PANGRAM_MODEL }), signal: signal() });
  const c = await created.json().catch(() => null);
  // Only a clear refusal (4xx: bad request, key, credits, rate limit) proves nothing was billed. A 5xx or an unreadable
  // answer may come after the task was created: the reservation is kept (billed: true), never given back.
  if (!created.ok) throw Object.assign(new Error('[ai-detect] Pangram task creation failed: HTTP ' + created.status), { status: created.status, billed: !(created.status >= 400 && created.status < 500) });
  if (!c) throw Object.assign(new Error('[ai-detect] Pangram task creation: unreadable answer (HTTP ' + created.status + ')'), { billed: true });
  // Some answers may already carry the result.
  if (c.stage === 'STAGE_SUCCESS' || c.prediction_short) return readPangramResult(c);
  if (!c.task_id) throw Object.assign(new Error('[ai-detect] Pangram answered without task_id'), { billed: true });
  for (let i = 0; i < maxPolls; i++) {
    await sleep(pollMs);
    if (Date.now() > deadline) break;
    const r = await fetchImpl(`${PANGRAM_ENDPOINT}/${encodeURIComponent(c.task_id)}`, { headers, signal: signal() });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) throw Object.assign(new Error('[ai-detect] Pangram task read failed: HTTP ' + r.status), { billed: true });
    if (j.stage === 'STAGE_SUCCESS') return readPangramResult(j);
    if (j.stage === 'STAGE_FAILED') throw Object.assign(new Error('[ai-detect] Pangram task failed'), { billed: true });
  }
  throw Object.assign(new Error('[ai-detect] Pangram task still running after ' + Math.round((totalMs - (deadline - Date.now())) / 1000) + ' s'), { billed: true });
}
