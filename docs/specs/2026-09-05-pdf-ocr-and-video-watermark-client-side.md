# pdf-ocr (Tesseract.js) and video-watermark (ffmpeg.wasm) — client-side rebuild

Status: approved, implementing both.
Date: 2026-09-05

## 0. Decision this spec implements

Two tools get real engines, both staying 100% client-side — no new server route, no new
third-party provider in the billing/quota sense, no change to `lib/quota/*` or
`guardPaidRoute`. This mirrors the constraint from
[[2026-09-05 market-and-load-test report]] (not a file — the prior conversation turn):
both candidates were chosen specifically because they need no server and no per-call
cost.

- **pdf-ocr**: replace the current pdfjs-only text-layer extraction (which returns
  nothing on a scanned PDF) with real OCR via **Tesseract.js**, run entirely in the
  browser.
- **video-watermark**: replace the current single-PNG-frame export with a real video
  export via **ffmpeg.wasm** (`@ffmpeg/ffmpeg` + `@ffmpeg/util`, already a dependency,
  already used by 7 tools), overlaying a text or image watermark and re-encoding video
  with audio preserved.

## 1. Engine-asset loading — same convention as the 7 existing ffmpeg tools, not a new one

`app/tools/audio-tools/audio-converter/page.jsx` (and the 6 other ffmpeg-based tools)
call `ffmpeg.load()` with **no arguments**, which uses `@ffmpeg/ffmpeg`'s own default
`baseURL` — a CDN fetch of `ffmpeg-core.js`/`ffmpeg-core.wasm`, not a call this codebase
controls or self-hosts. This is already shipped, already described in
`app/privacy/page.jsx` as "processing happens entirely in your browser," and nobody has
treated it as a third-party data flow, because it isn't one: it's a static, generic
engine binary with no user data in it, fetched once and cached by the browser. The
user's file never touches that CDN.

**video-watermark follows this exact precedent** — `ffmpeg.load()` default, no custom
`corePath`/`classWorkerURL`. **pdf-ocr follows the identical logic for Tesseract.js**:
`Tesseract.recognize()` / `createWorker()` fetch the tesseract-core wasm engine and the
requested language's `.traineddata` file from Tesseract.js's own default CDN
(jsdelivr) on first use, browser-cached after that. This is the same category of
static-asset fetch as ffmpeg's core, not a file upload, and needs no new privacy
disclosure — the thing `app/privacy/page.jsx` promises ("your file is never uploaded")
stays true because the file/image being OCR'd never leaves `recognize()`'s local
in-memory call.

This resolves the one open question worth flagging before implementing: **"no external
provider" in the user's constraint means no server-side call that touches the file or
costs money per use — not zero network requests ever.** Both engines already establish
that exact boundary on this site. No stop-and-ask needed; proceeding.

## 2. pdf-ocr

### 2.1 Pipeline
`app/tools/pdf-tools/pdf-ocr/page.jsx`, client-side only:
1. `pdfjs-dist` renders each PDF page to a canvas (not text extraction — this tool
   never reads a text layer; every page is treated as an image, which is what makes
   scanned PDFs work at all, unlike the current implementation).
2. Each page's canvas is handed to Tesseract.js (`createWorker`) for recognition.
3. Recognized text is concatenated per page, with a `--- Page N ---` separator (kept
   from the current UI convention).

### 2.2 Language selection
A `<select>` with at minimum **French and English**, chosen before running OCR.
Tesseract.js loads only the selected language's `.traineddata` (not both by default) —
picking one keeps the download smaller for the common case.

### 2.3 Progress — two phases, both visible
- **Model download**: Tesseract's worker logger reports `status: 'loading tesseract
  core'` / `'loading language traineddata'` with a `progress` fraction — surfaced as a
  labeled progress bar ("Downloading French language data... 42%") before recognition
  starts. First use only; browser-cached afterward.
- **Recognition**: per-page progress (`status: 'recognizing text'`) plus an overall
  "Page 2 of 5" counter, since multi-page PDFs can take a while and the current
  single "Converting..." spinner gives no sense of how much is left.

### 2.4 Page copy — rewritten for honesty, no superlatives
Must state plainly: reads scanned documents and images of text (this is the actual new
capability); works best on a straight, clean scan; a skewed or angled photo will
produce visible, garbled errors that need proofreading — not silent wrong answers, but
not free of errors either; everything runs in the browser, the file is never uploaded.
No "pixel-perfect," no "accurate," no unqualified accuracy claims — the load-tested
error rates (4-16% depending on image quality, all visibly garbled, never silently
fabricated) are the honest baseline this copy is describing.

## 3. video-watermark

### 3.1 Pipeline
`app/tools/video-tools/video-watermark/page.jsx`, client-side only:
1. User picks watermark type: **text** or **image**.
2. Both types render to a **canvas → PNG** client-side first (text watermark: draw the
   string with the chosen opacity; image watermark: draw the uploaded image with the
   chosen opacity). This unifies both modes into one ffmpeg code path —
   `overlay=<x>:<y>` against a single PNG input — instead of needing ffmpeg's
   `drawtext` filter, which requires a bundled font file inside the wasm FS and is a
   separate failure surface not worth adding when canvas text rendering already exists
   natively in every browser this site targets.
3. Position: 4-corner preset (top-left/top-right/bottom-left/bottom-right) plus center,
   mapped to `overlay` filter x/y expressions (e.g. `W-w-20:H-h-20` for bottom-right).
4. ffmpeg command maps video through the overlay filter and audio through explicitly
   (`-map '[v]' -map '0:a'`), re-encoding audio to AAC (`-c:a aac`) rather than
   attempting stream copy — the plain `-c:a copy` (with no explicit `-map` on both
   streams) combination was found to hang indefinitely with no error during this
   session's load testing, so the shipped code never uses it. Confirmed working on
   10s/60s/300s clips with audio intact using the explicit-map + re-encode shape.

### 3.2 Duration cap — 2 minutes, enforced before any ffmpeg work starts
On file selection, load the file into a hidden `<video>` element and read
`.duration` once metadata is available. If duration > 120s, reject immediately with:
*"This video is `{X}` — over the 2-minute limit. Watermarking runs in your browser and
takes roughly one second per second of video, so longer files would take too long or
risk freezing the tab. Trim it first, or use a shorter clip."* No ffmpeg load, no file
write to the virtual FS, no wasted work on a file that will be refused.

### 3.3 Progress and ETA
`ffmpeg.on('progress', ...)` (same event already used by `audio-converter`) drives a
progress bar. ETA is computed from the load-tested throughput (~1× realtime,
confirmed at 10s/60s/300s with no regression at longer durations) as
`remaining ≈ (1 - progress) × sourceDurationSeconds`, refreshed on every progress
event — not a fake/animated bar.

### 3.4 Page copy — states the limit and the wait before any upload
The 2-minute cap and the "about as long as your video's length" wait time must be
stated in the page body **above the upload control**, not only in the FAQ — this is
the one piece of copy a user needs before they act, not after.

## 4. Explicitly unaffected (verify, don't just assume)

- `lib/quota/*`, `guardPaidRoute`, `WORST_CASE_COST_MICROS` — no new keys, no new
  routes calling them. Both tools remain outside the paid-route system entirely.
- `app/privacy/page.jsx` — neither tool is added to the server-processed list (§1
  above explains why the CDN engine/model fetch doesn't count); re-read after
  implementation to confirm the file still says what it said before, for these two
  tools specifically.
- No `app/api/*` route is created or modified by this work.

## 5. Files touched

- `app/tools/pdf-tools/pdf-ocr/page.jsx` — rewritten.
- `app/tools/video-tools/video-watermark/page.jsx` — rewritten.
- `package.json` — add `tesseract.js` as a dependency (new; `@ffmpeg/ffmpeg` and
  `@ffmpeg/util` already present).
- No other file should need changes; `app/privacy/page.jsx` is checked, not edited,
  unless the check finds an existing inaccuracy unrelated to this work (in which case:
  stop and report it, don't silently fix scope beyond these two tools).
