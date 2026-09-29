// Pangram AI-text detection (docs/audit/RAPPORT-ai-detector-30-09.md) -- PREPARED, NOT IN SERVICE.
// Chosen on 30/09 because no zero-cost method measured on our corpus reached the market's level without calling
// human texts AI (RAIDAR, 3 open classifiers, Binoculars / Fast-DetectGPT with Qwen2.5), while Pangram is the
// detector with the lowest false-positive rate in the independent studies (Jabarian & Imas, NBER w34223, 2025) and
// supports French. Paid per word: nothing here runs until the owner opens a Pangram account and sets PANGRAM_API_KEY.
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

export function countWords(text) {
  const t = String(text || '').trim();
  return t ? t.split(/\s+/).length : 0;
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
 *  @param {{ apiKey: string, fetchImpl?: typeof fetch, pollMs?: number, maxPolls?: number, sleep?: (ms: number) => Promise<unknown> }} opts */
export async function detectWithPangram(text, { apiKey, fetchImpl = fetch, pollMs = 500, maxPolls = 60, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
  const created = await fetchImpl(PANGRAM_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ text, model: PANGRAM_MODEL }) });
  const c = await created.json().catch(() => null);
  if (!created.ok || !c) throw Object.assign(new Error('[ai-detect] Pangram task creation failed: HTTP ' + created.status), { status: created.status, billed: false });
  // Some answers may already carry the result.
  if (c.stage === 'STAGE_SUCCESS' || c.prediction_short) return readPangramResult(c);
  if (!c.task_id) throw Object.assign(new Error('[ai-detect] Pangram answered without task_id'), { billed: false });
  for (let i = 0; i < maxPolls; i++) {
    await sleep(pollMs);
    const r = await fetchImpl(`${PANGRAM_ENDPOINT}/${encodeURIComponent(c.task_id)}`, { headers });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) throw Object.assign(new Error('[ai-detect] Pangram task read failed: HTTP ' + r.status), { billed: true });
    if (j.stage === 'STAGE_SUCCESS') return readPangramResult(j);
    if (j.stage === 'STAGE_FAILED') throw Object.assign(new Error('[ai-detect] Pangram task failed'), { billed: true });
  }
  throw Object.assign(new Error('[ai-detect] Pangram task still running after ' + (pollMs * maxPolls) / 1000 + ' s'), { billed: true });
}
