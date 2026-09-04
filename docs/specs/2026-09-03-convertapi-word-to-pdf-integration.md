# ConvertAPI integration for Word-to-PDF — design spec

Status: approved scope — Word only. Excel decision closed (stays on Gotenberg,
permanently). PowerPoint decision open (stays on Gotenberg, pending further data).
Date: 2026-09-03 (narrowed same day, after Excel/PowerPoint testing closed both out of
scope for now — file renamed from
`2026-09-03-convertapi-office-to-pdf-integration.md` to reflect the single-route scope)

## 0. Decision this spec implements

**Only Word→PDF moves to ConvertAPI.** Excel→PDF and PowerPoint→PDF stay on Gotenberg —
Excel definitively, PowerPoint until new evidence changes the call. This is a one-route
change, not a three-route migration.

### Why the split — the evidence, per format

**Word: moves.** Converting the site owner's real CV through both engines and rendering
the output to PNG showed Gotenberg (LibreOffice) renders the document's `w:pgBorders
val="dashDotStroked"` page border as a plain double line and its three `<w:sym
w:font="Webdings">` header icons as blank boxes; ConvertAPI renders the border as a
textured dash pattern and all three icons correctly. In the same test run, ConvertAPI
was also faster (1.14s vs Gotenberg's 1.29s for that CV conversion). **Word is the only
format where ConvertAPI both fixes a real defect and does not cost latency to get it.**

**Excel: stays, permanently.** Four `.xlsx` files tested across two rounds — one
synthetic (`openpyxl`-built), three real (Vertex42 templates: an invoice, a family
budget planner, a Gantt chart). Result, by file:

| File | Rendering vs. Gotenberg | Latency vs. Gotenberg |
|---|---|---|
| Synthetic test file | **Worse** — a thick border around a merged title cell only covered about a third of the cell, text spilling out unbounded | 1.42s vs 1.19s (~1.2× slower) |
| Real invoice (18 merged ranges) | Identical | 4.97s vs 2.19s (~2.3× slower) |
| Real family budget (2 charts, no merges) | Identical | 5.42s vs 1.62s (~3.3× slower) |
| Real Gantt chart (11 merges, conditional formatting) | **Worse** — a conditional-formatting-driven "today" marker rendered as two dashed lines spanning two columns instead of Gotenberg's one correct solid line | 2.28s vs 0.82s (~2.8× slower) |

**ConvertAPI never rendered an Excel file better than Gotenberg. Twice identical, twice
worse. And 2-3× slower across every real-file test.** There is no version of this
evidence that argues for moving Excel — the CV's border/icon defect that justified
moving Word essentially does not occur in Excel (Wingdings/Webdings symbol fonts are a
Word pattern, not an Excel one), so Excel gets none of the upside and consistently pays
the downside. **Closed decision, not revisited without new evidence of a different
Excel-specific defect on the Gotenberg side.**

**PowerPoint: stays, pending more data.** One test available (a synthetic `.pptx`
exercising varied fonts, a filled/bordered text box, an image, a chart, bulleted list
formatting): rendering was visually indistinguishable between the two engines, and
ConvertAPI was 2.1× slower (2.67s vs 1.25s). Unlike Excel, this isn't a closed call —
one file is a thin sample, and PowerPoint can carry Wingdings/Webdings text the same way
Word can (both are stored as `.xml` runs with the same `w:sym`-style mechanism family in
OOXML). If a real presentation surfaces the same border/icon-class defect Word had, this
would need revisiting. Until then: no evidence of a gain, and a real latency cost, so it
stays on Gotenberg.

## 1. Route concerned (exact path, single format)

- **`app/api/convert-to-pdf/route.ts`** — the one route this spec changes, and the only
  one. It remains the single shared handler for all three tools (`ALLOWED_EXTENSIONS =
  docx, doc, xlsx, xls, csv, pptx, ppt`), dispatching on file extension. Only `.docx`
  moves; everything else keeps going to Gotenberg's `/forms/libreoffice/convert`
  exactly as today.

  ```js
  // Every non-docx row stays "gotenberg" by design, not by omission — this table is
  // the single place that answers "which engine handles this file," and it should
  // stay legible enough that the answer is obvious without reading control flow.
  const BACKEND_FOR_EXTENSION = {
    docx: "convertapi",
    doc: "gotenberg", xlsx: "gotenberg", xls: "gotenberg", csv: "gotenberg",
    pptx: "gotenberg", ppt: "gotenberg",
  };
  ```

  `.doc` (legacy binary Word) stays on Gotenberg too — the word-to-pdf tool's own UI
  only accepts `.docx` (`accept=".docx"`, page.jsx line 81) and its own FAQ says so
  ("The older binary .doc format isn't supported"), so `.doc` reaching this route at all
  would have to come through some other path; moving it was never in scope.

- **`app/tools/pdf-tools/word-to-pdf/page.jsx`** — UI accepts `.docx` only. Calls
  `/api/convert-to-pdf`. Copy changes at §6.
- **`app/tools/pdf-tools/excel-to-pdf/page.jsx`** and
  **`app/tools/pdf-tools/ppt-to-pdf/page.jsx`** — **not touched.** Still Gotenberg, still
  accurate as currently written.
- **New module: `lib/providers/convertApi.js`** — the adapter (§2).
- **`lib/quota/config.js`** — gains one new cost constant and one new
  `WORST_CASE_COST_MICROS` entry, keyed `'word-to-pdf'` (§3) — not `'office-to-pdf'`,
  since this is now a single-tool integration, not a shared multi-tool bucket.
- **`lib/officeSymbolFonts.js`** — not modified, but the route's use of it
  (`detectProprietarySymbolFonts` → `X-Detected-Symbol-Fonts` header) must be skipped for
  `.docx` files (§1a). Stays active, unchanged, for every other extension.
- **`lib/quota/adobeCounter.js`, `ADOBE_TX_CAP`** — deleted in a separate commit before
  this spec's implementation (§13 — this is no longer a "flagged for later" item, it is
  done).
- **Not touched by this spec**: `app/api/convert-html-to-pdf/route.ts` (EPUB/MOBI,
  Chromium engine) and `app/api/pdf-repair/route.ts` / `app/api/pdf-to-pdfa/route.ts`
  (`services/pdf-tools`, a third backend entirely).

### 1a. The Wingdings/Webdings disclosure becomes a false positive — for .docx only

`detectProprietarySymbolFonts()` warns the user, before and after conversion, that
Wingdings/Webdings icons will render as blank boxes — true for Gotenberg, now
**empirically false** for ConvertAPI on the CV that was tested. The route must not run
this scan, and must not set `X-Detected-Symbol-Fonts`, for `.docx` uploads. It must keep
doing both, unchanged, for every other extension — Excel and PowerPoint keep the
disclosure, because it stays accurate for them.

## 2. The adapter contract

**This introduces a pattern that does not exist yet in this codebase**: `remove-bg` and
the OpenAI-backed routes call their provider with an inline `fetch()` directly inside the
route handler (`app/api/remove-bg/route.ts` is the clearest example) — no adapter layer,
no separate module, anywhere today. `lib/providers/convertApi.js` will be the first. See
§13.

```js
// lib/providers/convertApi.js — the ONLY module in this codebase that knows
// ConvertAPI's base URL, its endpoint naming, its auth header, its StoreFile
// parameter, or the shape of its JSON response. The caller gets a Buffer in, a
// Buffer (or a typed error) out — it never sees a ConvertAPI URL, header, or
// response shape.

/**
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @returns {Promise<{ pdfBuffer: Buffer, costMicros: number }>}
 * @throws {ConvertApiError}
 */
async function convertDocxToPdf(fileBuffer, fileName) { /* ... */ }

class ConvertApiError extends Error {
  /**
   * Codes map directly to ConvertAPI's own documented responses (§4).
   * "upstream_error" is the only unmapped catch-all.
   * @param {"quota_exceeded"|"rate_limited"|"invalid_token"|"unsupported_format"|"timeout"|"corrupted_file"|"upstream_error"} code
   */
  constructor(code, message, { httpStatus, upstreamBody } = {}) { /* ... */ }
}

module.exports = { convertDocxToPdf, ConvertApiError };
```

Non-negotiable implementation constraints:

- `StoreFile=false` on every request, always — keeps the conversion in-memory with
  nothing written to ConvertAPI's disk, which is what makes the "sent, processed,
  deleted, never stored" privacy-page language (§7) true rather than aspirational.
- Auth via `Authorization: Bearer ${CONVERTAPI_TOKEN}` header only — never the `Secret`
  or `Auth` URL query parameters, both of which leak the token into server access logs.
  **The token must never appear in a log line, an error message, or a response body,
  under any failure path** — `ConvertApiError`'s `message` is always a static,
  pre-written string per code (§4's table), never a template that could interpolate
  request headers or the raw upstream body.
- Endpoint: `https://v2.convertapi.com/convert/docx/to/pdf`, `POST`, multipart field
  name `File` (capitalized).
- The route handler never imports `ConvertApiError`'s `httpStatus`/`upstreamBody` fields
  into a response body or a client-visible header — server-side logging only, and even
  there, logging must redact the `Authorization` header value before writing anything.

The route handler's job: check `BACKEND_FOR_EXTENSION[extension] === "convertapi"`
(true only for `.docx`), call either the existing inline Gotenberg logic or
`convertDocxToPdf()`, and translate whichever error comes back into one of the messages
in §4.

## 3. Quota system insertion point (exact modules)

ConvertAPI's cost is flat and known upfront — 10,000 micro-dollars per conversion ($10 /
1,000), confirmed both by ConvertAPI's own docs example (`"ConversionCost": 1`) and
empirically across every real call made during this evaluation. This fits the
**existing** `WORST_CASE_COST_MICROS` / `reserveGlobalSpend` / `guardPaidRoute`
mechanism (already used for `ai`, `ai-vision`, `ai-transcribe`, `remove-bg`) exactly —
no new counter module needed.

- **`lib/quota/config.js`**: add `CONVERTAPI_COST_MICROS = 10_000`. Add one key to
  `WORST_CASE_COST_MICROS`: `'word-to-pdf': CONVERTAPI_COST_MICROS`. Single-tool bucket,
  named for the one tool that uses it — Excel and PowerPoint never reach the guard at
  all, so they need no entry.
- **`lib/quota/guard.js`**: no changes — `guardPaidRoute(req, { route: "word-to-pdf",
  tool: "word-to-pdf" })`, called exactly like every other paid route.
- **Reservation**: only when the extension is `.docx`. Immediately before invoking
  `convertDocxToPdf()`, after the size check (§5) but before the network call.
- **Release**: `guard.release()` on any `ConvertApiError`.
- **Reconciliation**: `guard.commit(actualCostMicros)` where `actualCostMicros =
  response.ConversionCost * CONVERTAPI_COST_MICROS` — real reconciliation, not omitted,
  defending against the undocumented edge case of `ConversionCost` exceeding 1 for an
  unusual document.
- **`supabase/usage_events.sql`**'s `outcome` check constraint already includes every
  value needed (`accepted`, `denied_global_spend`, `provider_failed`) — no migration.

## 4. Error handling — real ConvertAPI codes, plain-language messages

Every code below is from ConvertAPI's own documented response-codes reference
(`convertapi.com/docs/response-codes`), not inferred. Messages are written for someone
who has never heard of ConvertAPI, Gotenberg, or an HTTP status code.

| Case | ConvertAPI's real response | User-facing message |
|---|---|---|
| Our own monthly spend cap reached | *(internal, never reaches ConvertAPI)* | "This tool has reached its usage limit for the month — that's a site-wide limit, not something on your end. It resets on `<date>`." |
| ConvertAPI account credits exhausted | HTTP 403, "No conversions remaining..." | "Conversion is temporarily unavailable. Please try again later." |
| ConvertAPI rate limit hit | HTTP 503 | "Conversion is temporarily unavailable. Please try again later." (same text as above — the user doesn't need to know these are different upstream causes; both alert the operator, §4a) |
| Token missing/invalid/expired/revoked (ConvertAPI does not distinguish these) | HTTP 401, `{"Code": 4013, ...}` | "Conversion isn't working right now. We've been notified." |
| Format not supported | HTTP 415 | "This file format isn't supported. Please upload a .docx file." |
| File too large | *(undocumented upstream — caught by our own 25 MB check before the call, §5)* | "This file is too large. Maximum size is 25 MB." |
| Conversion timeout | HTTP 500, `{"Code": 5000, ...}` | "This conversion is taking too long. Try a smaller or simpler file." |
| File corrupted/unparseable | HTTP 500, `{"Code": 5002, ...}` | "This file couldn't be converted. It may be corrupted or in an unexpected format." |
| Any other non-2xx | *(catch-all, `upstream_error`)* | "Conversion failed. Please try again." |

### 4a. Alerting

Every row above except the two success-adjacent ones (spend cap, unsupported format,
file too large — all routine and self-explanatory to the user) triggers
`alertServerError` server-side: credits/rate-limit/token/timeout/corrupted/catch-all are
all either an operator problem (top up, fix a credential) or worth knowing the shape of
even when the immediate fix is "wait and retry." No alert payload includes the token or
raw upstream response body — only the `ConvertApiError` code and HTTP status.

No automatic fallback to Gotenberg on any of these — every row ends in an explicit error
to the user, per the project's standing no-silent-provider-switch rule.

## 5. Size limit — validated before calling ConvertAPI

25 MB, checked client- and server-side before the network call (reusing
`lib/quota/limits.js`'s `checkFileSize()` pattern with a new
`MAX_CONVERTAPI_FILE_BYTES = 25 * 1024 * 1024` constant — same number as the existing
site-wide `MAX_FILE_SIZE_BYTES` in `convert-to-pdf/route.ts`, so this isn't a new,
separately-tunable ceiling, just the existing one enforced earlier, before a credit is
spent on a file that would fail anyway). ConvertAPI publishes no maximum file size for
`docx/to/pdf` in its documentation — checked specifically, confirmed absent, not just
unresearched — which is exactly why catching this before the call, with a limit we
control, matters: there's no reliable upstream error shape to catch it after the fact
(§4's "file too large" row is marked undocumented for the same reason).

## 6. Word-to-PDF page copy — generic wording, no vendor name

`app/tools/pdf-tools/word-to-pdf/page.jsx` only. Excel-to-PDF and PowerPoint-to-PDF
pages are **not touched** — their existing LibreOffice/Wingdings copy stays accurate.

- Line 107 (`SeoContent description`): remove "using LibreOffice, the same conversion
  engine used by many enterprise document pipelines" → generic "our conversion service."
  Remove the entire trailing sentence about Wingdings/Webdings rendering as blank boxes
  — false now, the same icons were verified rendering correctly through ConvertAPI.
- Line 116 (FAQ "Will my documents be uploaded to a server?"): remove "which uses
  LibreOffice to generate the PDF" → generic.
- Line 119 (FAQ "Why does this look different from the previous in-browser converter?"):
  "converts documents server-side with LibreOffice" → generic, no engine name.
- Tips array (~line 124, "LibreOffice-based conversion preserves fonts..."): drop the
  engine name, keep the substance.

Rule: the tool page never names the vendor. That's what the privacy page is for (§7).

## 7. Privacy page — names ConvertAPI, for Word only

`app/privacy/page.jsx`'s File Processing bullet currently has:

```
<li>Word to PDF, Excel to PDF, PowerPoint to PDF, EPUB to PDF, MOBI to PDF, PDF Repair,
    PDF to PDF/A: processed on our own servers (self-hosted, not shared with a third
    party).</li>
```

Word to PDF alone moves out, into a new bullet mirroring the existing OpenAI/Remove.bg
lines in Section 3:

```
<li>Word to PDF: your file is sent to ConvertAPI for processing, then deleted — see
    Section 3.</li>
```

...leaving `Excel to PDF, PowerPoint to PDF, EPUB to PDF, MOBI to PDF, PDF Repair, PDF to
PDF/A` in the original "our own servers" bullet, unchanged — Excel and PowerPoint stay
there because they are still processed there.

New line in Section 3 (Third-Party Services):

```
<li><strong>ConvertAPI:</strong> Used for Word-to-PDF conversion. Your file is sent to
    ConvertAPI for processing, with StoreFile=false so it is never written to their
    disk. See
    <a href="https://www.convertapi.com/privacy-policy" ...>ConvertAPI Privacy
    Policy</a>.</li>
```

## 8. Non-regression test plan

- **Word**: convert a real `.docx` (the CV used throughout this evaluation) through the
  shipped ConvertAPI path; confirm the border and the three header icons render
  correctly; confirm the `usage_counters` row for bucket `word-to-pdf` increments and
  decrements correctly across a success and a deliberately-forced failure (a temporarily
  wrong token, tested only against a preview environment, never the real production
  credential); confirm `usage_events` logs `accepted` / `provider_failed` correctly.
- **Excel**: unchanged code path — confirm `.xlsx`/`.xls`/`.csv` still convert via
  Gotenberg exactly as before, and the Wingdings/Webdings disclosure still fires when
  applicable.
- **PowerPoint**: same as Excel — unchanged path, confirm nothing regressed.
- **EPUB / MOBI**: smoke test through `/api/convert-html-to-pdf` — untouched by this
  spec, but a shared-file mistake is exactly what a regression test exists to catch.
- **Cross-cutting**: confirm the Wingdings/Webdings banner no longer appears for Word
  but still appears correctly for Excel/PowerPoint; confirm the rewritten word-to-pdf
  copy (§6) and privacy-page copy (§7) are live and match what the code does.

## 9. Rollback procedure

`CONVERTAPI_ENABLED` env var, checked before consulting `BACKEND_FOR_EXTENSION` — when
false (or unset), `.docx` also routes to Gotenberg, same as every other extension.
Flipping it back is an env var change plus a redeploy, not a code revert, matching the
project's established rollback pattern (the earlier Gotenberg-image cutover worked the
same way: change one variable, the old path was never touched or removed).

Fallback, if the flag mechanism itself is implicated: `git revert` of the merge commit
and redeploy.

`CONVERTAPI_TOKEN` stays configured on Vercel even after a rollback; disabling the flag
is sufficient and does not require removing the credential.

## 10. Configuration

`CONVERTAPI_TOKEN` and `CONVERTAPI_ENABLED` as Vercel environment variables, Production/
Preview/Development. **Not set by this spec or its implementation** — the site owner
adds these by hand; see the report accompanying this spec's implementation for the exact
list handed off.

## 11. Technical debt

- **`lib/quota/adobeCounter.js` and `ADOBE_TX_CAP`: deleted**, in a commit that precedes
  this spec's implementation (Adobe is eliminated as a vendor entirely — nothing in this
  codebase should still reference it). No longer a "flag for later" item.
- **No provider-adapter layer exists elsewhere in this codebase.** `remove-bg` and the
  OpenAI-backed routes call their external provider with an inline `fetch()` directly in
  the route handler — no separate module, no shared contract, no typed errors.
  `lib/providers/convertApi.js` (§2) is the first module of this shape in the repo.
  These existing routes would benefit from the same pattern later — not done as part of
  this spec, which touches only the Word-to-PDF/ConvertAPI integration.
