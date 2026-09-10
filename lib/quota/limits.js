// Client-safe: no process.env reads, no server-only imports. Imported by
// both the guarded API routes (authoritative enforcement) and the tool
// pages themselves (client-side pre-upload UX, spec §4.2.1).

const MAX_PROMPT_CHARS = 8000; // ~2,000 tokens
const MAX_VISION_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024; // see spec §4.2 "Why 10 MB, not OpenAI's own 25 MB ceiling"
const MAX_REMOVEBG_IMAGE_BYTES = 12 * 1024 * 1024;
// Same 25 MB ceiling as convert-to-pdf/route.ts's own MAX_FILE_SIZE_BYTES --
// not a new, separately-tunable limit, just the existing one enforced
// earlier (before a ConvertAPI credit is spent on a file that would fail
// anyway). See docs/specs/2026-09-03-convertapi-word-to-pdf-integration.md §5.
const MAX_CONVERTAPI_FILE_BYTES = 25 * 1024 * 1024;

// Contact form attachments (docs/audit/RAPPORT-pieces-jointes-contact.md):
// GitHub's own per-image convention (10MB) and Resend's real hard cap
// (40MB post-base64, ~28-30MB raw) would both allow much larger files --
// but this project's deployed serverless function rejects the whole
// request with a platform-level 413 (FUNCTION_PAYLOAD_TOO_LARGE, before
// this route's own code ever runs) somewhere between 4.4MB and 4.7MB
// total body, empirically measured against production. That measured
// ceiling, not the market comparison, is what actually binds here. 4MB
// total / 3MB per file leaves real margin under it for multipart
// overhead and the text fields.
const MAX_CONTACT_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_CONTACT_ATTACHMENTS_COUNT = 3;
// Real image formats a screenshot is actually saved as, that every email
// client can render inline -- not HEIC/AVIF (poor client support) or BMP
// (large, rare for screenshots). Verified against real bytes via
// app/lib/detectFileFormat.js, never the filename or declared MIME type.
const CONTACT_ATTACHMENT_ACCEPTED_FORMATS = ['png', 'jpg', 'gif', 'webp'];
const CONTACT_ATTACHMENT_ACCEPTED_LABEL = 'PNG, JPEG, GIF, or WebP';

function checkPromptLength(text) {
  const length = (text || '').length;
  if (length <= MAX_PROMPT_CHARS) return { ok: true };
  return {
    ok: false,
    message: `Text is limited to ${MAX_PROMPT_CHARS.toLocaleString()} characters — this input is ${length.toLocaleString()}.`,
  };
}

function checkFileSize(file, maxBytes, label) {
  if (!file || file.size <= maxBytes) return { ok: true };
  const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
  const fileMb = (file.size / (1024 * 1024)).toFixed(1);
  return { ok: false, message: `${label} are limited to ${maxMb} MB — this file is ${fileMb} MB.` };
}

module.exports = {
  MAX_PROMPT_CHARS, MAX_VISION_IMAGE_BYTES, MAX_AUDIO_UPLOAD_BYTES, MAX_REMOVEBG_IMAGE_BYTES,
  MAX_CONVERTAPI_FILE_BYTES,
  MAX_CONTACT_ATTACHMENT_BYTES, MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES, MAX_CONTACT_ATTACHMENTS_COUNT,
  CONTACT_ATTACHMENT_ACCEPTED_FORMATS, CONTACT_ATTACHMENT_ACCEPTED_LABEL,
  checkPromptLength, checkFileSize,
};
