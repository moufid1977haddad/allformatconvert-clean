// scripts/quota-tests/03-config.js
const assert = require('node:assert');
const { checkPromptLength, checkFileSize, MAX_PROMPT_CHARS, MAX_AUDIO_UPLOAD_BYTES } = require('../../lib/quota/limits');
const { WORST_CASE_COST_CENTS, actualAiCostCents, actualAiTranscribeCostCents, GLOBAL_SPEND_CAP_CENTS } = require('../../lib/quota/config');

assert.strictEqual(checkPromptLength('a'.repeat(MAX_PROMPT_CHARS)).ok, true);
assert.strictEqual(checkPromptLength('a'.repeat(MAX_PROMPT_CHARS + 1)).ok, false);

assert.strictEqual(checkFileSize({ size: MAX_AUDIO_UPLOAD_BYTES }, MAX_AUDIO_UPLOAD_BYTES, 'Audio files').ok, true);
assert.strictEqual(checkFileSize({ size: MAX_AUDIO_UPLOAD_BYTES + 1 }, MAX_AUDIO_UPLOAD_BYTES, 'Audio files').ok, false);

// The worst-case reservation for a single transcribe call must stay well
// under the global cap -- this is the exact regression this bound exists to
// prevent (spec §4.2 "Why 10 MB, not OpenAI's own 25 MB ceiling").
assert.ok(WORST_CASE_COST_CENTS['ai-transcribe'] < GLOBAL_SPEND_CAP_CENTS / 10,
  `a single worst-case transcribe reservation (${WORST_CASE_COST_CENTS['ai-transcribe']}c) should allow at least 10 calls/month under the cap (${GLOBAL_SPEND_CAP_CENTS}c)`);

assert.strictEqual(actualAiCostCents({ prompt_tokens: 0, completion_tokens: 0 }), 0);
assert.ok(actualAiCostCents({ prompt_tokens: 1000, completion_tokens: 1000 }) > 0);
assert.ok(actualAiTranscribeCostCents(120) > 0);

console.log('PASS: config.js cost formulas and limits.js client checks.', WORST_CASE_COST_CENTS);
