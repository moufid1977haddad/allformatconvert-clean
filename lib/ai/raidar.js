// RAIDAR (Mao et al., ICLR 2024, "geneRative AI Detection viA Rewriting"): a language model asked to "polish" a text
// changes human writing much more than text a model wrote. Similarity = 1 - Levenshtein(original, rewrite) /
// max(length), in characters, as in the paper (§3.2). Shared by the AI Detector page and its calibration script.

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Uint32Array(b.length + 1), cur = new Uint32Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

// The request sent with the text (after the Chatbot's neutral instruction): RAIDAR's "Help me polish this", asking
// for the text alone so no preamble is counted as a change.
export const POLISH_PROMPT = 'Help me polish this. Reply with the polished text only, nothing else:\n\n';

// A preamble the model may still add ("Here is the polished version:") and quotes around the text are not changes.
export function cleanRewrite(s) {
  let t = String(s || '').trim();
  const lines = t.split('\n');
  if (lines.length > 1 && lines[0].length < 80 && /:\s*$/.test(lines[0])) t = lines.slice(1).join('\n').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('“') && t.endsWith('”'))) t = t.slice(1, -1).trim();
  return t;
}

// Whitespace is normalised first: a rewrite that only re-flows lines is not a change of the text.
export function raidarSimilarity(original, rewrite) {
  const a = String(original || '').replace(/\s+/g, ' ').trim(), b = String(rewrite || '').replace(/\s+/g, ' ').trim();
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Bands measured on www on 30/09 (scripts/browser-tests/ai-detector-calibration.mjs, 20 texts of about 100 words,
// gpt-4o-mini through the site's own route): similarity of human texts 0.545-0.884 (Gutenberg classics, Wikipedia,
// the owner's French), AI texts 0.760-0.961 (gpt-4o-mini and Claude, English and French). At 0.90 and above: AI
// (4 of 9 AI texts, 0 of 11 human texts); under 0.80: human (9 of 11 human texts, 1 of 9 AI texts); between: no
// verdict. Short texts are not judged (the paper's paragraphs; under 40 words the change ratio is too noisy).
export const AI_AT = 0.9;
export const HUMAN_BELOW = 0.8;
export const MIN_WORDS = 40;
export function raidarVerdict(sim) {
  return sim >= AI_AT ? 'ai' : sim < HUMAN_BELOW ? 'human' : 'uncertain';
}
