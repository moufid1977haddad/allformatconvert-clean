// Client-safe: no process.env reads, no server-only imports. Imported by
// both the guarded API routes (authoritative enforcement) and the tool
// pages themselves (client-side pre-upload UX, spec §4.2.1).

const MAX_PROMPT_CHARS = 8000; // ~2,000 tokens
const MAX_VISION_IMAGE_BYTES = 5 * 1024 * 1024;
// 25 MiB = OpenAI's own Whisper limit. It was 10 MiB (spec §4.2) and is now reachable because the staged upload
// (lib/media/staged.js) carries files past the ~4.5 MB Vercel body ceiling; the worst-case spend reservation
// (lib/quota/config.js) scales with this value.
const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
// The ORIGINAL file the visitor selects, checked entirely client-side before
// any resize or network call -- see docs/audit/RAPPORT-detourage-taille-fichiers.md.
// Set to match the most generous of remove.bg (12MB), Pixian.ai (no fixed MB
// limit, up to 32MP), and PhotoRoom (50MB, live-checked docs.photoroom.com) --
// project rule: no competitor accepts a larger file than this site does.
// Safe to be this generous specifically because the browser resizes the image
// to MODEL_INPUT_SIZE (1024px longest side, matching the model's own fixed
// internal resolution -- see services/background-removal/app/infer.py) before
// ever sending bytes over the network; only that small resized copy needs to
// fit under MAX_REMOVEBG_UPLOAD_BYTES below. The visitor's original file
// never leaves the browser and is what the final transparent PNG is recomposed
// against, at full original resolution.
const MAX_REMOVEBG_ORIGINAL_BYTES = 50 * 1024 * 1024;
// The actual wire payload (resized image, base64+JSON) sent to /api/remove-bg.
// Same measured Vercel serverless payload ceiling as MAX_CONTACT_ATTACHMENT_BYTES
// below (4.4-4.7MB total body, empirically measured -- see
// docs/audit/RAPPORT-pieces-jointes-contact.md and
// docs/audit/RAPPORT-detourage-taille-fichiers.md). The 1024px-longest-side
// resize this guards should never produce a payload anywhere near this size in
// practice (typically well under 1MB) -- this is a defensive ceiling, not the
// binding constraint day to day.
const MAX_REMOVEBG_UPLOAD_BYTES = 3 * 1024 * 1024;
// Same 25 MB ceiling as convert-to-pdf/route.ts's own MAX_FILE_SIZE_BYTES --
// not a new, separately-tunable limit, just the existing one enforced
// earlier (before a ConvertAPI credit is spent on a file that would fail
// anyway). See docs/specs/2026-09-03-convertapi-word-to-pdf-integration.md §5.
// Was 25 MiB (spec §5, self-imposed). Measured 2026-09-21: ConvertAPI converted a 98.7 MiB and a 148 MiB .docx.
const MAX_CONVERTAPI_FILE_BYTES = 100 * 1024 * 1024;

// The REAL ceiling of every route that receives a file through Vercel: the
// platform rejects the whole request (FUNCTION_PAYLOAD_TOO_LARGE, before any
// of our code runs) somewhere above ~4.4MB. Measured against production on
// 2026-09-19: a 4,412,819-byte file passes, a 4,517,676-byte one is refused
// (.xlsx/.pptx/.docx/pdf-to-word -- raw multipart, no base64 inflation), and
// a 5.3MB body is refused on convert-to-pdf, pdf-to-word, convert-html-to-pdf,
// pdf-repair, pdf-to-pdfa and ai-transcribe alike (see
// docs/audit/RAPPORT-plafonds-declares.md). 4 MiB sits under the measured
// pass point. The 25MB / 50MB / 10MB figures inside the routes are unreachable
// behind this gate -- this is the number a visitor can actually hit.
const MAX_PLATFORM_UPLOAD_BYTES = 4 * 1024 * 1024;
// Same gate, for tools that send the image as base64 inside JSON (x1.33): a
// 3 MiB source image is a ~4 MiB body, again under the measured pass point.
const MAX_PLATFORM_IMAGE_BASE64_SOURCE_BYTES = 3 * 1024 * 1024;
// Documents sent through the media-processing service's staged upload (browser -> service in signed
// 8 MiB chunks, then read server-to-server by the Vercel route): the Vercel body ceiling above no longer
// applies. PROVISIONAL until measured with real files (docs/audit/RAPPORT-office-envoi-morceaux.md).
const MAX_OFFICE_STAGED_BYTES = 100 * 1024 * 1024;
// Spreadsheets are bound by conversion TIME, not size: Gotenberg's API_TIMEOUT is 60 s in production and a 17.6 MiB
// workbook (12 columns x ~500k rows) took ~50 s, a 24.7 MiB one was cut off. 15 MiB keeps a margin.
// PDF to Word: 30 MiB converted in 59 s, 60 MiB in 104 s (ConvertAPI, ~1.7 s per MiB); 60 MiB is the largest measured.
const MAX_PDF_TO_WORD_STAGED_BYTES = 60 * 1024 * 1024;
const MAX_SPREADSHEET_STAGED_BYTES = 15 * 1024 * 1024;
// Below this size the direct multipart request is kept (fewer round trips); above it, staged.
// Must stay under MAX_PLATFORM_UPLOAD_BYTES.
const OFFICE_STAGED_THRESHOLD_BYTES = 1024 * 1024; // measured: the staged path adds ~2 s of fixed round trips (docs/audit/RAPPORT-office-envoi-morceaux.md)
// Whisper (OpenAI) refuses audio above 25 MB whatever the transport, so this is a provider limit, not ours.
const MAX_AUDIO_STAGED_BYTES = MAX_AUDIO_UPLOAD_BYTES;
// PDF Repair / PDF to PDF/A: the routes' own ceiling (stricter than the pdf-tools service's), reachable through the staged upload.
const MAX_PDFTOOLS_STAGED_BYTES = 50 * 1024 * 1024;
const PLATFORM_LIMIT_HINT = 'the current upload limit of our hosting platform. Larger files are refused before conversion starts.';

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

// Pre-upload check for the platform ceiling above. Says the real reason and the
// real limit instead of the generic "Conversion failed" a bare 413 produces.
function checkPlatformUploadSize(file, maxBytes = MAX_PLATFORM_UPLOAD_BYTES) {
  if (!file || file.size <= maxBytes) return { ok: true };
  const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
  const fileMb = (file.size / (1024 * 1024)).toFixed(1);
  return {
    ok: false,
    message: `This file is ${fileMb} MB but this tool accepts files up to ${maxMb} MB — ${PLATFORM_LIMIT_HINT}`,
  };
}

module.exports = {
  MAX_PDF_TO_WORD_STAGED_BYTES, MAX_SPREADSHEET_STAGED_BYTES, MAX_PDFTOOLS_STAGED_BYTES, MAX_AUDIO_STAGED_BYTES, MAX_OFFICE_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES,
  MAX_PLATFORM_UPLOAD_BYTES, MAX_PLATFORM_IMAGE_BASE64_SOURCE_BYTES, PLATFORM_LIMIT_HINT,
  checkPlatformUploadSize,
  MAX_PROMPT_CHARS, MAX_VISION_IMAGE_BYTES, MAX_AUDIO_UPLOAD_BYTES,
  MAX_REMOVEBG_ORIGINAL_BYTES, MAX_REMOVEBG_UPLOAD_BYTES,
  MAX_CONVERTAPI_FILE_BYTES,
  MAX_CONTACT_ATTACHMENT_BYTES, MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES, MAX_CONTACT_ATTACHMENTS_COUNT,
  CONTACT_ATTACHMENT_ACCEPTED_FORMATS, CONTACT_ATTACHMENT_ACCEPTED_LABEL,
  checkPromptLength, checkFileSize,
};
