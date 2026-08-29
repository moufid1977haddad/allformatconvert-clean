// Server-only: reads process.env. Never imported by a 'use client' page --
// client components import lib/quota/limits.js instead.
const { MAX_PROMPT_CHARS, MAX_AUDIO_UPLOAD_BYTES } = require('./limits');

const GLOBAL_SPEND_CAP_MICROS = Math.round(Number(process.env.GLOBAL_SPEND_CAP_USD || 20) * 1_000_000);
const ADOBE_TX_CAP = Number(process.env.ADOBE_TX_CAP || 450);
const USER_QUOTA_PDF_CONVERSIONS = Number(process.env.USER_QUOTA_PDF_CONVERSIONS || 5);
const USER_QUOTA_IMAGES = Number(process.env.USER_QUOTA_IMAGES || 5);
const IP_RATE_LIMIT_PER_HOUR = Number(process.env.IP_RATE_LIMIT_PER_HOUR || 10);
const IP_RATE_LIMIT_PER_DAY = Number(process.env.IP_RATE_LIMIT_PER_DAY || 30);

const ALERT_THRESHOLDS = [50, 80, 100];

// gpt-4o-mini list pricing (2026-08, per spec §4.3 -- flagged there for the
// user to confirm against their actual billing tier before launch).
const GPT4O_MINI_INPUT_PER_TOKEN = 0.15 / 1_000_000;
const GPT4O_MINI_OUTPUT_PER_TOKEN = 0.60 / 1_000_000;
const WHISPER_PER_MINUTE = 0.006;
const REMOVEBG_PER_IMAGE_DOLLARS = 0.20;

const CHARS_PER_TOKEN = 4; // standard conservative approximation for English text
const AI_MAX_OUTPUT_TOKENS = 1000; // matches max_tokens in app/api/ai/route.ts
const AI_VISION_MAX_OUTPUT_TOKENS = 500; // matches max_tokens in app/api/ai-vision/route.ts
// A high-detail image at typical online-tool resolutions costs at most
// ~1500 tokens under OpenAI's image-tokenization formula -- used as the
// worst case since the byte-size bound doesn't fix a specific resolution.
const VISION_IMAGE_WORST_CASE_TOKENS = 1500;
// Conservative floor: real-world speech audio rarely encodes below ~32kbps;
// a LOWER assumed bitrate yields a LONGER worst-case duration for the same
// file size, which is the conservative (safe) direction for a reservation.
const AUDIO_WORST_CASE_BITRATE_KBPS = 32;

function dollarsToMicros(dollars) {
  return Math.ceil(dollars * 1_000_000);
}

function worstCaseAiCostCents() {
  const inputTokens = MAX_PROMPT_CHARS / CHARS_PER_TOKEN;
  return dollarsToMicros(inputTokens * GPT4O_MINI_INPUT_PER_TOKEN + AI_MAX_OUTPUT_TOKENS * GPT4O_MINI_OUTPUT_PER_TOKEN);
}

function worstCaseAiVisionCostCents() {
  const inputTokens = MAX_PROMPT_CHARS / CHARS_PER_TOKEN + VISION_IMAGE_WORST_CASE_TOKENS;
  return dollarsToMicros(inputTokens * GPT4O_MINI_INPUT_PER_TOKEN + AI_VISION_MAX_OUTPUT_TOKENS * GPT4O_MINI_OUTPUT_PER_TOKEN);
}

function worstCaseAudioSeconds() {
  const bytesPerSecond = (AUDIO_WORST_CASE_BITRATE_KBPS * 1000) / 8;
  return MAX_AUDIO_UPLOAD_BYTES / bytesPerSecond;
}

function worstCaseAiTranscribeCostCents() {
  const minutes = worstCaseAudioSeconds() / 60;
  return dollarsToMicros(minutes * WHISPER_PER_MINUTE);
}

function worstCaseRemoveBgCostCents() {
  return dollarsToMicros(REMOVEBG_PER_IMAGE_DOLLARS);
}

const WORST_CASE_COST_MICROS = {
  ai: worstCaseAiCostCents(),
  'ai-vision': worstCaseAiVisionCostCents(),
  'ai-transcribe': worstCaseAiTranscribeCostCents(),
  'remove-bg': worstCaseRemoveBgCostCents(),
};

// Returns null (not 0) when the provider's response doesn't give us enough
// to compute a real cost -- a missing/malformed `usage` object is a signal
// that something is wrong with the provider integration, not proof the call
// was free. Callers (guard.js's commit()) must treat null as "keep the
// worst-case reservation, log the incident" -- never silently zero it out.
function actualAiCostMicros(usage) {
  if (!usage || typeof usage.prompt_tokens !== 'number' || typeof usage.completion_tokens !== 'number') {
    return null;
  }
  return dollarsToMicros(usage.prompt_tokens * GPT4O_MINI_INPUT_PER_TOKEN + usage.completion_tokens * GPT4O_MINI_OUTPUT_PER_TOKEN);
}

// Same null-for-unknown contract as actualAiCostMicros above.
function actualAiTranscribeCostMicros(durationSeconds) {
  if (typeof durationSeconds !== 'number' || Number.isNaN(durationSeconds)) {
    return null;
  }
  const minutes = durationSeconds / 60;
  return dollarsToMicros(minutes * WHISPER_PER_MINUTE);
}

module.exports = {
  GLOBAL_SPEND_CAP_MICROS, ADOBE_TX_CAP, USER_QUOTA_PDF_CONVERSIONS, USER_QUOTA_IMAGES,
  IP_RATE_LIMIT_PER_HOUR, IP_RATE_LIMIT_PER_DAY, ALERT_THRESHOLDS,
  WORST_CASE_COST_MICROS, actualAiCostMicros, actualAiTranscribeCostMicros,
};
