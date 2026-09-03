# ConvertAPI integration for Word/PowerPoint → PDF — design spec

Status: draft, revised after real-file Excel testing, pending validation before implementation
Date: 2026-09-03 (revised same day — see §8 for what changed and why)

## 0. Decision this spec implements

**Word→PDF and PowerPoint→PDF move to ConvertAPI. Excel→PDF stays on Gotenberg.** This
is a durable architecture, not a temporary staging step — two conversion engines behind
the same tool category, permanently, each earning its place on its own evidence. See §1
for exactly where that split lives in the code, and §8 for why Excel was kept back
despite a same-day real-file test that mostly (not cleanly) cleared it.

Adobe PDF Services is eliminated as a candidate: its free tier caps at 500
transactions/month and the next tier requires a 500,000-transactions/year minimum
commitment, with nothing self-serve in between. Not revisited here.

Grounds for moving Word/PowerPoint: converting the site owner's real CV through both
engines and rendering the output to PNG showed Gotenberg (LibreOffice) renders the
document's `w:pgBorders val="dashDotStroked"` page border as a plain double line and its
three `<w:sym w:font="Webdings">` header icons as blank boxes; ConvertAPI renders the
border as a textured dash pattern and all three icons correctly. Not re-litigated here.

Grounds for keeping Excel on Gotenberg: see §8. In short — a synthetic test file showed
ConvertAPI drawing an incomplete border around a merged, bordered title cell, a pattern
common in real spreadsheets (Wingdings/Webdings symbol fonts, the defect that justified
moving Word/PowerPoint, are rare in Excel by contrast) — so for this one format the
fidelity trade-off runs the other way. A same-day test on three real, richly-formatted
workbooks did not reproduce that specific defect, but surfaced a different, smaller
rendering discrepancy instead. Mixed evidence, not a clean reversal — Excel stays put
until that gets a deliberate follow-up decision, not an automatic one triggered by this
spec revision.

## 1. Routes concerned (exact paths, verified against the current code)

- **`app/api/convert-to-pdf/route.ts`** — the one route this spec changes. Today it is a
  single shared handler for all three tools: it dispatches purely on file extension
  (`ALLOWED_EXTENSIONS = docx, doc, xlsx, xls, csv, pptx, ppt`), not on a `tool` or
  `route` parameter, and sends every accepted file to Gotenberg's
  `/forms/libreoffice/convert`. There is currently **no quota/spend guard on this route
  at all** — correct today, since a self-hosted Gotenberg call has no external per-call
  cost to protect against. This migration is the first time this route needs one.

  **The durable split lives here, as an extension-keyed backend table, not an if/else
  chain that reads like a temporary migration:**

  ```js
  // The map IS the architecture decision — reading this object tells you the whole
  // routing policy without reading control flow. Extending it later (e.g. moving .xlsx
  // to ConvertAPI after a follow-up decision) is a one-line change here, nothing else.
  const BACKEND_FOR_EXTENSION = {
    docx: "convertapi", doc: "convertapi",
    pptx: "convertapi", ppt: "convertapi",
    xlsx: "gotenberg", xls: "gotenberg", csv: "gotenberg",
  };
  ```

- **`app/tools/pdf-tools/word-to-pdf/page.jsx`** — UI accepts `.docx` only
  (`accept=".docx"`, line 81). Calls `/api/convert-to-pdf`.
- **`app/tools/pdf-tools/excel-to-pdf/page.jsx`** — UI accepts `.xlsx,.xls,.csv` (line
  81). Calls `/api/convert-to-pdf`. Unaffected by this migration — stays on Gotenberg.
- **`app/tools/pdf-tools/ppt-to-pdf/page.jsx`** — UI accepts `.pptx` only (line 81).
  Calls `/api/convert-to-pdf`.
- **New module: `lib/providers/convertApi.js`** — the adapter (§2). New directory;
  nothing in `lib/providers/` exists yet (see §12, technical debt).
- **`lib/quota/config.js`** — gains one new cost constant and one new
  `WORST_CASE_COST_MICROS` entry (§3). No new file.
- **`lib/officeSymbolFonts.js`** — not modified, but `app/api/convert-to-pdf/route.ts`'s
  use of it (`detectProprietarySymbolFonts` → `X-Detected-Symbol-Fonts` header) must be
  skipped for files routed to ConvertAPI — see §1a.
- **Not touched by this spec**: `app/api/convert-html-to-pdf/route.ts` (EPUB/MOBI,
  Chromium engine — different route, different Gotenberg endpoint, unaffected) and
  `app/api/pdf-repair/route.ts` / `app/api/pdf-to-pdfa/route.ts` (a third backend
  entirely, `services/pdf-tools` via `PDFTOOLS_SERVICE_URL` — unrelated to this
  decision).

### 1a. The Wingdings/Webdings disclosure becomes a false positive for ConvertAPI

`detectProprietarySymbolFonts()` exists to warn the user, before and after conversion,
that Wingdings/Webdings icons will render as blank boxes — true for the Gotenberg route,
now **empirically false** for ConvertAPI (verified: the same real CV's three header
icons rendered correctly through ConvertAPI). The route must not run this scan, and must
not set `X-Detected-Symbol-Fonts`, for `.docx`/`.doc`/`.pptx`/`.ppt` (the
`BACKEND_FOR_EXTENSION = "convertapi"` rows). It must keep doing both, unchanged, for
`.xlsx`/`.xls`/`.csv` (Excel stays on Gotenberg — the disclosure stays accurate there).

## 2. The adapter contract

**This introduces a pattern that does not exist yet in this codebase, worth flagging
explicitly rather than presented as "following existing convention": `remove-bg` and the
OpenAI-backed routes call their provider with an inline `fetch()` directly inside the
route handler (`app/api/remove-bg/route.ts` is the clearest example — no adapter layer,
no separate module). This spec builds `lib/providers/convertApi.js` as asked, but it is
a new convention, not a mirror of one already in use.** See §12 and report §3.

```js
// lib/providers/convertApi.js — the ONLY module in this codebase that knows
// ConvertAPI's base URL, its endpoint-per-format naming, its auth header, its
// StoreFile parameter, or the shape of its JSON response. Every caller gets a
// Buffer in, a Buffer (or a typed error) out.

/**
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {"docx"|"doc"|"pptx"|"ppt"} sourceFormat
 * @returns {Promise<{ pdfBuffer: Buffer, costMicros: number }>}
 * @throws {ConvertApiError}
 */
async function convertOfficeToPdf(fileBuffer, fileName, sourceFormat) { /* ... */ }

class ConvertApiError extends Error {
  /**
   * Codes map directly to ConvertAPI's own documented responses — see §4 for the
   * source of each. "upstream_error" is the only unmapped catch-all, reserved for
   * responses that don't match any of the documented shapes below.
   * @param {"quota_exceeded"|"rate_limited"|"invalid_token"|"unsupported_format"|"timeout"|"corrupted_file"|"upstream_error"} code
   */
  constructor(code, message, { httpStatus, upstreamBody } = {}) { /* ... */ }
}

module.exports = { convertOfficeToPdf, ConvertApiError };
```

Non-negotiable implementation constraints on the inside of `convertOfficeToPdf`:

- `StoreFile=false` on every request, always — this is what keeps the conversion
  in-memory with nothing written to ConvertAPI's disk, which is what makes the "sent,
  processed, deleted, never stored" privacy-page language (§7) true rather than aspirational.
- Auth via `Authorization: Bearer ${CONVERTAPI_TOKEN}` header only. Never the `Secret`
  or `Auth` URL query parameters — both exist in ConvertAPI's API for backward
  compatibility but leak the token into server access logs.
- Endpoint is `https://v2.convertapi.com/convert/${sourceFormat}/to/pdf`, `POST`,
  multipart field name `File` (capitalized — confirmed against ConvertAPI's own current
  docs, not assumed from memory).
- The route handler (`convert-to-pdf/route.ts`) never imports `ConvertApiError`'s
  `httpStatus`/`upstreamBody` fields into a response body or a client-visible header —
  those exist for server-side logging only (§4's messages are the only user-facing text).

The route handler's job becomes: look up `BACKEND_FOR_EXTENSION`, call either the
existing inline Gotenberg logic or `convertOfficeToPdf()`, and translate whichever error
comes back into one of the messages in §4. It never constructs a ConvertAPI URL, header,
or request body itself.

## 3. Quota system insertion point (exact modules)

ConvertAPI's cost is flat and known upfront — 10,000 micro-dollars per conversion ($10 /
1,000), confirmed both by ConvertAPI's own docs example (`"ConversionCost": 1` in a
sample response) and empirically, from real calls against the site owner's own CV and
three real Word/PowerPoint-shaped files, all of which returned `ConversionCost: 1`. A
flat, known-upfront cost is exactly what the **existing** `WORST_CASE_COST_MICROS` /
`reserveGlobalSpend` / `guardPaidRoute` mechanism (already used for `ai`, `ai-vision`,
`ai-transcribe`, `remove-bg`) is built for. **This spec reuses that mechanism rather than
building a second, Adobe-style dedicated counter module** — see §12 for why
`adobeCounter.js` is not the template to copy.

- **`lib/quota/config.js`**: add `CONVERTAPI_COST_MICROS = 10_000` (a plain constant,
  already in micros — no `dollarsToMicros()` call needed, unlike the dollar-denominated
  AI/remove-bg constants). Add one new key to `WORST_CASE_COST_MICROS`:
  `'office-to-pdf': CONVERTAPI_COST_MICROS`. One shared key for Word and PowerPoint —
  cost is identical for both, and the existing `tool` parameter (already threaded through
  `guardPaidRoute(req, {route, tool})` in every other paid route) keeps per-tool
  granularity in `usage_events` without needing two separate cost-bucket keys. (Excel
  needs no entry here at all — it never reaches the guard, since it stays on Gotenberg.)
- **`lib/quota/guard.js`**: no changes — `guardPaidRoute(req, { route: "office-to-pdf",
  tool })` is called exactly like every other paid route already does.
- **Reservation**: happens once, only when `BACKEND_FOR_EXTENSION[extension] ===
  "convertapi"` — never for Excel. `route.ts` calls `guardPaidRoute` immediately before
  invoking `convertOfficeToPdf()`, after the existing size/extension validation (§5) but
  before the network call.
- **Release**: `guard.release()` on any `ConvertApiError`.
- **Reconciliation**: `guard.commit(actualCostMicros)` where `actualCostMicros =
  response.ConversionCost * CONVERTAPI_COST_MICROS`. In the confirmed-normal case this
  equals the reservation exactly (delta 0), but wiring a real reconciliation rather than
  omitting the argument defends against the still-undocumented edge case of whether
  `ConversionCost` can exceed 1 for an unusually large/complex document (§5).
- **`adobeCounter.js` / `ADOBE_TX_CAP`**: untouched by this spec (no code changes
  authorized) — see §12.
- **`supabase/usage_events.sql`**'s `outcome` check constraint already includes every
  value this integration needs (`accepted`, `denied_global_spend`, `provider_failed`) —
  **no schema migration required**.

## 4. Error handling — real ConvertAPI codes, not deduced ones

Every row below is sourced from ConvertAPI's own documented response-codes reference
(`convertapi.com/docs/response-codes`), not inferred from general REST conventions. Two
independent fetches of that page agreed; the ones marked **undocumented** were explicitly
absent from it, not just unnoticed.

| Case | ConvertAPI's real response | User-facing message | Also |
|---|---|---|---|
| Our own monthly spend cap reached (before calling ConvertAPI at all) | *(internal — `guardPaidRoute` returns `{ok:false}`, never reaches ConvertAPI)* | *(already implemented, reused as-is)* "This tool has reached its usage limit for the month — that's a site-wide limit, not something on your end. It resets on `<date>`." | HTTP 503, `Retry-After` header |
| ConvertAPI account has exhausted its purchased credits | **HTTP 403**, no numeric sub-code documented; message text "No conversions remaining. Upgrade your plan or purchase more conversions." | "Conversion service is temporarily unavailable. Please try again later." | `alertServerError` — this is an operator incident (someone needs to top up), never a per-user problem, and must not be confused with the routine monthly-cap message above |
| ConvertAPI rate limit hit (a pace problem, distinct from the balance problem above) | **HTTP 503** | Same user-facing message as the row above — the distinction matters for our own logging/alerting, not for what the user sees | `alertServerError` |
| API token missing/invalid | **HTTP 401**, `{"Code": 4013, "Message": "Missing credentials. Please provide a valid API token."}` | "Conversion service is not configured." | Mirrors the exact existing message for a missing Gotenberg env var; `alertServerError`, never logs the token. **ConvertAPI's docs do not distinguish "invalid" from "expired" from "revoked" — all three collapse into this same 401/4013 response; this spec cannot promise a different message per sub-case because ConvertAPI itself doesn't expose one.** |
| Format not supported | **HTTP 415**, message text "The file is not supported by file server or endpoint." | "Unsupported file type. Allowed: .docx" *(word-to-pdf)* / ".pptx" *(ppt-to-pdf)* | Validated before any network call anyway (§5), so this row is a defense-in-depth catch, not the primary guard |
| File exceeds a size ceiling | **Undocumented.** ConvertAPI's response-codes page has no entry for a file-size error at all — checked explicitly, confirmed absent, not just unresearched. | "File is too large. Maximum size is `X` MB." | Validated **before** any network call (§5) precisely because the upstream failure shape for this case is unknown — the app-level check is the only reliable place this is ever caught cleanly |
| Conversion exceeds ConvertAPI's own timeout | **HTTP 500**, `{"Code": 5000, "Message": "Conversion timeout."}` | "Conversion timed out. Try a smaller file." | Same wording as the existing Gotenberg timeout path (that one is client-side `AbortController`, this one is ConvertAPI's own server-side timeout — different mechanism, same user-facing text) |
| Uploaded file is corrupted/unparseable | **HTTP 500**, `{"Code": 5002, "Message": "File is damaged."}` | "Conversion failed. The document may be corrupted or in an unsupported format." | Same wording as the existing Gotenberg generic-failure message |
| Any other non-2xx not matching a documented shape above | *(catch-all — `ConvertApiError` code `upstream_error`)* | "Conversion failed. The document may be corrupted or in an unsupported format." | HTTP 502 |

No automatic fallback to Gotenberg on any of these — every row ends in an explicit error
to the user, per the project's standing no-silent-provider-switch rule.

## 5. Size/format limits to validate before calling ConvertAPI

- **Confirmed working, by direct API call, real files**: `docx`, `pptx` — both returned
  HTTP 200 with `ConversionCost: 1` converting real files this evaluation used. Word→PDF
  and PowerPoint→PDF need only these two, and both are fully covered.
- **`doc` (legacy binary Word)**: documented (`/convert/doc/to/pdf` shown in ConvertAPI's
  own docs), not independently tested this session.
- **Excel formats — resolved, established fact, not researched fresh this revision**:
  the `xlsx/to/pdf` converter explicitly accepts `.xls` as well as `.xlsx`; `csv/to/pdf`
  is a separate, dedicated converter with automatic column-width fitting, 10-300% scaling,
  orientation, page-size, header-repeat, and separator-normalization options. **This
  removes the endpoint-existence gap the previous revision of this spec flagged for
  `.xls`/`.csv`** — but it doesn't change §0's decision: Excel stays on Gotenberg
  regardless of whether ConvertAPI can technically handle its formats, because the
  reason to hold it back is a rendering-fidelity finding (§8), not a format-coverage gap.
  This paragraph exists so a future revision that revisits §8 doesn't have to re-derive
  it.
- **Maximum file size: no number published for any of these converters**, confirmed
  checked specifically for `xlsx`/`csv` in addition to the earlier `docx`/`pptx` check.
  Recommendation unchanged: keep the site's own existing `MAX_FILE_SIZE_BYTES = 25 MB`
  app-level cap for the ConvertAPI path, validated client- and server-side before the
  network call (reusing `lib/quota/limits.js`'s `checkFileSize()` pattern with a new
  `MAX_CONVERTAPI_FILE_BYTES` constant) — this is also the only reliable place the
  undocumented file-too-large case (§4) is ever caught cleanly.

## 6. Tool page copy to rewrite — generic wording, no vendor name

**Rule (Révision 2): tool pages never name the vendor.** Word-to-PDF and PowerPoint-to-PDF's
copy should read "our conversion service" or equivalent, exactly the same phrasing
pattern already used elsewhere on the site for backend implementation details visitors
don't need. This is a deliberate asymmetry with §7: the privacy page names ConvertAPI
explicitly (visitors evaluating a privacy policy need the real sub-processor name to make
an informed judgment); the tool page copy is marketing/help copy, where naming a specific
vendor commits the page to a claim that has to be kept in sync with procurement decisions
it shouldn't need to know about.

**`app/tools/pdf-tools/word-to-pdf/page.jsx`**
- Line 107 (`SeoContent description`): remove "using LibreOffice, the same conversion
  engine used by many enterprise document pipelines" (replace with generic "our
  conversion service" language, no vendor name) and remove the entire trailing sentence
  about Wingdings/Webdings rendering as blank boxes — false for the ConvertAPI path,
  where the same icons were verified rendering correctly.
- Line 116 (FAQ "Will my documents be uploaded to a server?"): remove "which uses
  LibreOffice to generate the PDF" — generic "our conversion service" instead.
- Line 119 (FAQ "Why does this look different from the previous in-browser converter?"):
  "converts documents server-side with LibreOffice" → generic, no engine name.
- Tips array (~line 124, "LibreOffice-based conversion preserves fonts..."): same — drop
  the engine name, keep the substance (fonts/spacing/layout preserved).

**`app/tools/pdf-tools/ppt-to-pdf/page.jsx`** — identical shape to word-to-pdf: lines
107, 116, 119, and the tips array.

**`app/tools/pdf-tools/excel-to-pdf/page.jsx`** — **unchanged by this spec.** Excel stays
on Gotenberg (§0); its existing "LibreOffice" and Wingdings/Webdings-blank-boxes copy
stays true and stays as-is.

## 7. Privacy page — names ConvertAPI explicitly

**Rule (Révision 2), the mirror image of §6: the privacy page names the vendor.**
`app/privacy/page.jsx`'s File Processing bullet (corrected 2026-09-03, this session, to
name each server-side tool's actual destination) currently has:

```
<li>Word to PDF, Excel to PDF, PowerPoint to PDF, EPUB to PDF, MOBI to PDF, PDF Repair,
    PDF to PDF/A: processed on our own servers (self-hosted, not shared with a third
    party).</li>
```

Word to PDF and PowerPoint to PDF move out of it into a new bullet, exactly on the model
of the existing OpenAI/Remove.bg lines in Section 3 — vendor named, both places:

```
<li>Word to PDF, PowerPoint to PDF: your file is sent to ConvertAPI for processing,
    then deleted — see Section 3.</li>
```

...leaving `Excel to PDF, EPUB to PDF, MOBI to PDF, PDF Repair, PDF to PDF/A` in the
original "our own servers" bullet, unchanged.

And a new line in Section 3 (Third-Party Services), matching the existing OpenAI/
Remove.bg format exactly:

```
<li><strong>ConvertAPI:</strong> Used for Word and PowerPoint-to-PDF conversion. Your
    file is sent to ConvertAPI for processing, with StoreFile=false so it is never
    written to their disk. See
    <a href="https://www.convertapi.com/privacy-policy" ...>ConvertAPI Privacy
    Policy</a>.</li>
```

This is exactly the "one line to add, not a rewrite" structure the earlier privacy-page
fix was deliberately built for.

## 8. Excel: the real-file test, run this revision (Révision 5)

**What changed from the previous revision of this spec**: the earlier version gated
Excel's move behind a check using "a real file the site owner would supply." That check
has now been run — three real, richly-formatted `.xlsx` files, from a legitimate public
source, not synthetic. This section documents what was tested and what was found;
§0/§1 already reflect the resulting decision (Excel stays on Gotenberg).

### Files used, and where they came from

All three from Vertex42 (vertex42.com), a template publisher whose Gantt chart template
is explicitly licensed to Microsoft for distribution through Microsoft's own official
template gallery — a legitimate, non-synthetic source:

1. **Simple Invoice** (`vertex42.com/ExcelTemplates/simple-invoice.html`) — 18 merged
   cell ranges, thick/medium/double border styles, colored fills. The closest real-world
   analog to the synthetic test's "merged, bordered title" shape.
2. **Family Budget Planner** (`vertex42.com/ExcelTemplates/family-budget-planner.html`)
   — 2 native embedded charts (line + bar), colored header-row fills, no merged cells.
3. **Simple Gantt Chart** (`vertex42.com/ExcelTemplates/simple-gantt-chart.html`) — 11
   merged cell ranges, and its task bars are drawn with real Excel conditional
   formatting (not a native chart object) — the closest real-world analog to "does
   conditional formatting survive."

Together the three cover every element the gate asked for (merged+bordered titles,
thick borders, fills, a chart, conditional formatting); no single one of the three has
all five, which is realistic — most real spreadsheets don't either.

### What was found (from images actually rendered and looked at, not inferred)

- **Invoice**: rendered near-pixel-identically between Gotenberg and ConvertAPI at a
  300 dpi crop of the merged, colored header boxes ("MAILING INFO" / "BILL TO" bands,
  the green "Company Name" / "INVOICE" title band). **The synthetic test's incomplete
  merged-border defect did not reproduce here.**
- **Budget**: both native charts rendered correctly and near-identically on both
  engines; colored header-row fills intact on both; no merged cells in this file to
  begin with.
- **Gantt**: no merged-border defect either. But a real, different discrepancy did turn
  up, found only after a first low-resolution look wrongly suggested Gotenberg was
  missing the "today" marker entirely — a 300 dpi crop corrected that: **both engines
  draw a today-marker line, but Gotenberg draws one solid line in the correct column,
  and ConvertAPI draws two dashed lines spanning two columns** (the conditional
  formatting rule appears to be applied to one extra column in ConvertAPI's rendering).
  A real fidelity difference, and this time **ConvertAPI is the less precise one** — the
  opposite direction from the CV border/icon findings driving the rest of this spec.

### Verdict

The specific defect that justified holding Excel back (an incomplete border around a
merged title cell) **does not reproduce on any of the three real files tested.** That is
a real, evidence-based point in favor of moving Excel too. But it is not a clean
disproof: three files is not an exhaustive sample, and this same test surfaced a
different rendering discrepancy (the duplicated today-marker line) that nothing in the
original gate anticipated — evidence that ConvertAPI and Gotenberg diverge on Excel
conditional formatting in ways not yet fully mapped, in either direction.

**Decision, this revision: Excel stays on Gotenberg regardless.** The evidence leans
toward "the original concern was probably file-specific," but a mixed result with a
newly-discovered discrepancy is not the same thing as the gate being cleared — moving a
tool on "probably fine, with a new open question" is exactly the kind of judgment call
that deserves an explicit go-ahead from whoever approves this spec, not an automatic
flip triggered by the revision that ran the test. If Excel is greenlit to move in a
follow-up revision, `BACKEND_FOR_EXTENSION`'s `xlsx` row (and, separately, `xls`/`csv`,
now confirmed endpoint-covered per §5) is the one-line change that does it.

## 9. Non-regression test plan

- **Word**: convert a real `.docx` (the CV already used throughout this evaluation is a
  good candidate) through the shipped ConvertAPI path; confirm the border and the three
  header icons render correctly (the two defects this whole migration exists to fix);
  confirm a `usage_counters` row for bucket `office-to-pdf` increments and decrements
  correctly across a success and a deliberately-forced failure (e.g. a temporarily wrong
  token, tested only against a preview environment, never by touching the real
  production credential); confirm `usage_events` logs `accepted` / `provider_failed`
  correctly in each case.
- **Excel**: no change to test — it stays on Gotenberg, so the existing (currently
  untested-by-this-spec, pre-existing) behavior simply needs confirming it was not
  touched: `.xlsx`/`.xls`/`.csv` still convert via Gotenberg exactly as before.
- **PowerPoint**: same shape as Word.
- **EPUB / MOBI**: a smoke test through `/api/convert-html-to-pdf` to prove this
  migration did not regress the unrelated Chromium route — these tools share no code
  with this spec's changes, but a shared-file mistake (e.g. an accidentally-touched
  shared constant) is exactly the kind of thing a regression test exists to catch instead
  of assume away.
- **Cross-cutting**: confirm the Wingdings/Webdings disclosure banner no longer appears
  for Word/PowerPoint (now false, §1a) but still appears correctly for Excel (still
  routed to Gotenberg); confirm the rewritten tool-page (generic, §6) and privacy-page
  (vendor-named, §7) copy is live and matches what the code actually does.

## 10. Rollback procedure

Primary mechanism: an environment-variable-gated backend selector inside
`convert-to-pdf/route.ts` (e.g. `CONVERTAPI_ENABLED`, checked before consulting
`BACKEND_FOR_EXTENSION`) — flipping it back to "everything through Gotenberg" is an env
var change plus a redeploy, not a code revert, matching the project's established
rollback pattern for the earlier Gotenberg-image cutover. This also gives a single kill
switch if ConvertAPI itself has an outage, without needing to reason about which of
Word/PowerPoint is affected (Excel is never affected either way — it was never routed to
ConvertAPI).

Fallback, if the flag mechanism itself is implicated in the problem: `git revert` of the
merge commit and redeploy, the same way any other regression on this codebase is rolled
back.

`CONVERTAPI_TOKEN` stays configured on Vercel (Production, Preview, Development — as a
secret env var, never committed) even after a rollback; disabling the feature flag is
sufficient and does not require removing the credential.

## 11. Configuration

`CONVERTAPI_TOKEN` must be added as a Vercel secret environment variable across all
three environments (Production, Preview, Development) before this ships to any of them —
`.env.local`'s existing value (used for this evaluation's own testing) is a local
convenience copy, not a substitute for the Vercel-side secret the deployed app actually
reads from.

## 12. Technical debt (Révision 4 — flagged, not fixed here)

- **`lib/quota/adobeCounter.js` and the `ADOBE_TX_CAP` constant in `lib/quota/config.js`
  are now dead code.** Both were pre-provisioned for a plan to back the future
  `pdf-to-excel`/`pdf-to-ppt` tools with Adobe PDF Services — a plan that predates, and
  is superseded by, Adobe's elimination as a vendor entirely (§0). Nothing in this spec
  uses them (§3 uses the existing generic `WORST_CASE_COST_MICROS` mechanism instead).
  **Recommend deletion in a separate cleanup PR** — out of scope here, since this spec
  authorizes no code changes.
- **No provider-adapter layer exists yet anywhere in this codebase.** `remove-bg`
  (`app/api/remove-bg/route.ts`) and the OpenAI-backed routes call their external
  provider with an inline `fetch()` directly inside the route handler — no separate
  module, no shared contract, no typed errors. `lib/providers/convertApi.js` (§2) will
  be the first module of this shape in the repo. **These existing routes would benefit
  from being aligned to the same adapter pattern later** (consistent error handling,
  consistent StoreFile/auth-header-style discipline enforced in one place instead of
  per-route) — explicitly not done as part of this spec, which touches only the
  ConvertAPI integration.
