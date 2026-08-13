# Functional audit tooling

Drives every tool page with Playwright and checks it actually produces a
result (download / in-page output change), rather than just loading without
errors. Complements the visual/structural audits — this one checks behavior.

## Usage

```bash
npm run dev                              # target must be running (default http://localhost:3000)
node scripts/audit/categorize.js         # (re)classify all app/tools/**/page.{jsx,tsx} -> tool-config.json
node scripts/audit/runners/run-audit.js  # full run, all 225 tools
node scripts/audit/runners/run-audit.js --slugs=csv-to-excel,json-formatter  # just some tools
node scripts/audit/runners/run-audit.js --base=https://preview-url.vercel.app --no-warmup
```

Results land in `scripts/audit/results/run-<timestamp>.json` (gitignored —
regenerate rather than diffing against a committed snapshot).

## How it works

`categorize.js` scans each tool's source for `type="file"`, a non-readOnly
`<textarea>`, `getUserMedia`/`getDisplayMedia`, `Coming Soon`, and an
internal `fetch('/api/...')` call, and buckets it into a category:
`file-upload`, `paste-text`, `dual-mode` (an explicit paste-or-upload
toggle), `form-generator`, `recorder`, or `stub`. `run-audit.js` has one
driving strategy per category, plus a lightweight check for tools that call
an internal API (pass/fail is based on the HTTP status, not response
quality).

Fixtures live in `fixtures/files/` — small real files per format (PDF via
pdf-lib, DOCX via `docx`, XLSX/XLS via `xlsx`, GIF via `gifenc`, images via
a headless-Chromium canvas, WebM via `captureStream()` + `MediaRecorder`,
EPUB/ZIP/TAR hand-built, WAV/BMP/ICO hand-encoded) — no ffmpeg, no native
canvas binding, no network fetch required. Regenerate with
`node scripts/audit/fixtures/build-node-fixtures.js` and
`node scripts/audit/fixtures/build-browser-fixtures.js`.

## Known gaps (verdict `fixture-gap`)

No local fixture for: `.heic`/`.heif`, `.tif`/`.tiff`, `.mobi`/`.azw`/`.azw3`,
`.pptx`, `video/avi`. These formats are genuinely hard to synthesize without
a native library or a real sample file — tools that require them are
skipped, not failed.

## Verdicts

| Verdict | Meaning |
|---|---|
| `pass` | Real output produced (download with non-zero size, or in-page content changed) |
| `fail` | Action ran but produced nothing, or a required element (file input / textarea) was never found |
| `review` | No recognizable action button / ambiguous UI — needs a human or a per-tool tweak |
| `api-error` | An internal `/api/*` call returned 4xx/5xx. **Check `.env.local` before treating this as a real bug** — it commonly means a provider key (AI Gateway) or `GOTENBERG_URL`/`GOTENBERG_USERNAME`/`GOTENBERG_PASSWORD` isn't set locally, not that the tool is broken in production. |
| `fixture-gap` | Skipped — no local fixture for the required file type |
| `stub-ok` | Confirmed "Coming Soon" placeholder, expected |

A `fail`/`review` result is a lead, not a verdict — always check the tool's
source before reporting it as broken. In the August 2026 run, every `fail`
and `review` turned out to be a categorizer/runner limitation (a paste-or-
upload toggle, a readOnly output textarea misread as an input, an
unrecognized button verb) rather than an actual site bug, confirmed by
manually exercising each one in a browser.
