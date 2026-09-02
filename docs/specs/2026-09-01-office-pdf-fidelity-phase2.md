# Office→PDF fidelity, phase 2 — volet A (Calibri Light + Arial Narrow) + real-document test

Follows the phase 1 diagnostic (2026-08-31): confirmed Carlito/Caladea
(Calibri/Cambria's metric substitutes) already work correctly in the
current production Gotenberg service; confirmed Wingdings symbols render
as empty boxes; found (testing a synthetic `.pptx`) that "Calibri Light" —
a distinct font name Office themes use for titles/headings — is NOT
covered by the same substitution and falls back to Liberation Sans
instead of Carlito.

## Volet A — the "Calibri Light" fix

`services/gotenberg/` is a new Docker image, `FROM gotenberg/gotenberg:8.36.0`
(pinned, not floating), adding one fontconfig rule
(`/etc/fonts/conf.d/99-office-font-substitutions.conf`) that renames
"Calibri Light" requests to "Carlito" before LibreOffice's font matcher
sees them. No new font file is added — see `FONTS.md` for why, and for the
license/origin of every font already in the base image that this rule
touches.

## Volet A, extended — the Arial Narrow fix (2026-09-01, after the user's real CV was tested)

The real-document test below (originally run to check for anything a
synthetic file might have missed) found a second, more consequential gap:
the CV's actual body font — Arial Narrow, 834 of 834 runs — has no
correct substitute either, silently falling back to Carlito (not a
condensed design). The user asked this be fixed in the same image build
as Calibri Light rather than shipping and re-testing twice.

Added: the Debian package `fonts-liberation-sans-narrow` (installed via
`apt-get` in the Dockerfile, same pattern as every other font already in
the base image) plus a second fontconfig rule, "Arial Narrow" → "Liberation
Sans Narrow". License verified directly against the font's own
`License.txt` before adding it (not assumed from the user's description):
GPLv2 with Red Hat's font-embedding exception — same license family the
original Liberation Sans/Serif/Mono already in the base image used before
the wider project moved to OFL 1.1. Full reasoning, including why this
font isn't in the current `liberation-fonts` 2.00.0+ release, in
`FONTS.md`.

Re-checked the same real CV's every XML part (not just the body text) for
any other font gap: none found. Courier New/Arial/Calibri also appear
(bullet-list definitions in `numbering.xml`) but all three already
resolve correctly via fonts already in the base image.

This directory does not build, run, or deploy anything by itself in this
session — no Docker or Railway access here (confirmed: `docker` command
not found, no Railway CLI/API tool available). Per the user's own
division of labor: this repo's code is written and pushed here; the user
deploys it as a second Railway service and runs the comparison
conversions themselves. See "Deploying and proving this" below for the
exact steps and commands handed off.

## Real-document test (2026-09-01)

The user provided their actual CV (`CV_MOUFID HADDAD.docx`) — the file
that originally showed the problem — after an earlier synthetic `.docx`
was mistakenly used first. Inspected its XML directly (not guessed) and
converted it through the **current, unmodified production** Gotenberg
service (same one live at `GOTENBERG_URL`, used read-only, no changes).

### What the file actually asks for (XML inspection)

| Location | Fonts / mechanism |
|---|---|
| `word/document.xml` body runs | `Arial Narrow` — 834 of 834 font references. No Calibri, Cambria, Wingdings, or Symbol run anywhere in the visible body text. |
| `word/document.xml`, explicit symbol inserts | Three `<w:sym>` elements, font `Webdings`, chars `F048`, `F0BE`, `F0C9` — the location/email/phone icons in the header contact line. |
| `word/numbering.xml` (bullet list definitions) | `Wingdings` (46 refs), `Symbol` (26), `Courier New` (25), `Arial` (4), `Calibri` (4) — bullet glyphs for the document's bulleted lists. |
| `word/styles.xml` | `Calibri` (12 refs) in style definitions, but no visible run actually uses an unstyled/default font — every visible run explicitly sets Arial Narrow. |
| `word/theme/theme1.xml` | Standard Office theme boilerplate (Cambria/Calibri as major/minor theme fonts) — present in every `.docx` by default, not actually invoked by any run here. |
| Anywhere | **"Calibri Light" does not appear in this file at all.** Volet A's fix does not touch anything visible in this specific document. |

### What happened when converted

Embedded fonts in the output PDF: `Carlito-Regular`, `NotoSans-Regular`,
`NotoSans-Bold`, `OpenSymbol`.

- **The three Webdings header icons (location/email/phone) render as empty
  boxes** — confirmed visually. Same root cause as phase 1's Wingdings
  finding: no font in the container covers Webdings' proprietary glyph
  set either.
- **The bullet list markers render fine** (plain round bullets), despite
  being defined via Wingdings/Symbol in `numbering.xml` — LibreOffice
  appears to special-case the specific "solid round bullet" glyph
  regardless of which legacy symbol font requested it. Not broken here.
- **New finding, not covered by phase 1 or volet A: "Arial Narrow" — the
  document's actual body font, 834 of 834 runs — has no correct
  substitute in this container either.** It resolves to `Carlito`, which
  is not a condensed/narrow design at all (Carlito matches Calibri's
  proportions, not Arial Narrow's ~15-20% tighter character width). This
  is a real, distinct gap from both the Calibri-Light finding and the
  Wingdings finding — it explains, with reasonable confidence, at least
  part of "les retours à la ligne diffèrent": a body font rendered wider
  than intended will wrap differently regardless of any symbol-font issue.
  **Not yet researched** (no assumption made about what substitute might
  fix it) — flagged here as a new, unplanned gap the real-document test
  surfaced, exactly the kind of thing synthetic files didn't show.

### What remains unexplained

I cannot produce a byte-for-byte "what would real Microsoft Word have
rendered" comparison — no Word or the real fonts are available here. The
Arial Narrow width mismatch is stated with confidence because it's true
by font design (Carlito is definitionally not a narrow face), not because
I measured an exact line-break diff against a genuine Word render. Any
remaining layout difference beyond what's explained above (margins,
table/frame handling, other LibreOffice DOCX-import quirks) is not ruled
out or in — untested.

## Deploying and proving this (handed to the user, not run here)

**Railway service (new, separate from the existing Gotenberg service):**
- Project: `fortunate-manifestation` (existing project) → New Service →
  Deploy from GitHub repo → Root Directory: `services/gotenberg`.
- Environment variables to set on this new service:
  - `GOTENBERG_API_BASIC_AUTH_USERNAME` — set to the **same value** as the
    existing Gotenberg service's Basic Auth username, so the site's
    existing request code (which sends `GOTENBERG_USERNAME`/
    `GOTENBERG_PASSWORD` as Basic Auth) would work unmodified if this
    service is ever pointed to. This is a *different variable name* than
    the app's own `GOTENBERG_USERNAME` (that one lives in this repo's env,
    read by the Next.js routes to build the auth header they send — it
    doesn't need to change). This one is Gotenberg's own native config,
    consumed by the container itself.
  - `GOTENBERG_API_BASIC_AUTH_PASSWORD` — same idea, matching password value.
  - No other env vars — this image reads nothing else new. (The base
    image has its own defaults for timeouts/port; not overridden here.)
- Basic Auth is enabled unconditionally by this image's `CMD` (see
  Dockerfile) — setting only the env vars without the `--api-enable-basic-auth`
  flag would do nothing, per Gotenberg's own docs; baking the flag into
  the image avoids that trap regardless of Railway's UI settings.
- Healthcheck path: `/health` (identical to the existing service; this
  was confirmed live in phase 1 — `{"status":"up","details":{"chromium":
  {"status":"up"...},"libreoffice":{"status":"up"...}}}`).
- Replicas: 1 — this is a comparison/test service, not production traffic.

**Converting the same file through both services (PowerShell, credentials
never echoed to the screen):**

```powershell
$gotenbergUser = Read-Host "Gotenberg username"
$securePass = Read-Host "Gotenberg password" -AsSecureString
$gotenbergPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass))

$file = "C:\Users\moufi\Desktop\Moufid\CV_MOUFID HADDAD.docx"

# OLD service (current production Gotenberg -- untouched)
curl.exe -u "${gotenbergUser}:${gotenbergPass}" `
  -F "files=@$file" `
  "https://<EXISTING-GOTENBERG-URL>/forms/libreoffice/convert" `
  -o "cv-old-service.pdf"

# NEW service (this volet's test deployment)
curl.exe -u "${gotenbergUser}:${gotenbergPass}" `
  -F "files=@$file" `
  "https://<NEW-GOTENBERG-URL>/forms/libreoffice/convert" `
  -o "cv-new-service.pdf"
```

Replace the two URLs with the existing service's `GOTENBERG_URL` (already
in `.env.local`) and the new Railway service's public URL. Compare
`cv-old-service.pdf` and `cv-new-service.pdf` by eye — since "Calibri
Light" doesn't appear in the CV, expect these two to look **identical**;
run the same two commands against the synthetic `.pptx`/`.docx` from
phase 1 (in the scratchpad, or regenerate them) to actually see the title
placeholder difference this volet fixes.

**Reminder (PowerShell, not bash):** `curl` in PowerShell is an alias for
`Invoke-WebRequest`, which doesn't understand `-u`/`-F`/`-o` the same way
— always call `curl.exe` explicitly, as above.

## Volet B — Wingdings/Webdings research (no code, report only)

Three questions, answered from primary sources, not assumed.

### 1. Does LibreOffice have an internal symbol-font substitution table? Does it apply here? Can it be triggered?

**Confirmed: no.** LibreOffice's own bug tracker settles this directly.
[Bug 88418](https://libreoffice-bugs.freedesktop.narkive.com/BriNbnW4/bug-88418-new-formatting-wingdings-font-not-applied-in-docx-file-symbols)
reports the exact symptom (a Wingdings arrow renders as garbled text). A
LibreOffice developer's response: *"I don't have Wingdings installed
here. Perhaps you could use a more universally-supported arrow
character?"* — the reporter then confirmed the fix was copying the real
`wingding.ttf` from a Windows machine onto the Linux system's font
directory. The bug was closed **RESOLVED/INVALID**: not a LibreOffice
defect, a missing-font situation, full stop, in the words of LO's own
team.

This matches this project's own phase-1 and phase-2 empirical testing
exactly: the legacy **"Symbol"** font (a different, older font name) *did*
render correctly across all three Office formats tested, via LibreOffice's
own bundled **OpenSymbol** font — OpenSymbol was built to cover that
specific legacy encoding and generic bullet/math glyphs. It was never
built to also contain Wingdings' distinct, arbitrary proprietary glyph
set. There is no hidden flag to "activate" broader coverage in OpenSymbol
for Wingdings specifically — the coverage isn't there by design, not by
misconfiguration.

### 2. Is there a free, verifiable Wingdings/Webdings-to-Unicode mapping table?

Yes, tables exist — but a table is not a fix by itself. Two kinds found:

- **Reference tables** (not code, just documentation of the mapping):
  [Alan Wood's Wingdings](https://www.alanwood.net/demos/wingdings.html)
  and [Webdings](https://www.alanwood.net/demos/webdings.html) pages, and
  a 2014 [Unicode.org mailing list thread](https://corp.unicode.org/pipermail/unicode/2014-July/000839.html)
  titled "Official mappings between Wingdings/Webdings and Unicode" —
  confirms Microsoft's own PUA assignment (U+F020–U+F0FF, legacy byte
  value + 0xF000 offset) is documented, but "official" here means
  *documented*, not that Unicode assigns standard equivalents for every
  glyph — many Wingdings icons (a specific stylized folder, a specific
  clip-art-style airplane) have no single canonical Unicode codepoint at
  all, only an approximate one.
- **A runnable mapping project**: [dingbat-to-unicode](https://github.com/mwilliamson/dingbat-to-unicode)
  (GitHub/PyPI) explicitly maps Symbol/Webdings/Wingdings codepoints to
  Unicode. **Its exact license and the completeness/accuracy of its
  mapping data could not be independently verified in this session** —
  its README/LICENSE files 404'd on the paths tried, and PyPI's page
  didn't load through the fetch tool available here. Flagged as
  unverified, not assumed usable.

Even with a verified table, using one is **not a Dockerfile/fontconfig
change** — fontconfig only substitutes font *family names*, not
individual character codepoints conditional on which font requested them.
Applying a codepoint remap means rewriting the actual PUA characters in
the uploaded document's XML (`w:sym` elements and Wingdings-font text
runs) to their Unicode equivalents *before* handing the file to Gotenberg,
then rendering with an already-present open Unicode symbol font (Noto
Sans Symbols / Noto Color Emoji — both already in the current image). That
is real new preprocessing logic in this site's own code, not a Docker
image change — a materially larger undertaking than volet A, gated on a
mapping table this session could not confirm is complete or correctly
licensed.

### 3. Which Microsoft fonts are legally redistributable? Is Wingdings one of them?

**No, and the margin isn't close.**

- Microsoft's only ever freely-distributed TrueType pack was
  ["Core fonts for the Web"](https://en.wikipedia.org/wiki/Core_fonts_for_the_Web)
  (1996–2002, discontinued): Andalé Mono, Arial, Arial Black, Comic Sans
  MS, Courier New, Georgia, Impact, Times New Roman, Trebuchet MS,
  Verdana, **Webdings**. Its EULA ([full text](https://corefonts.sourceforge.net/eula.htm))
  explicitly states: *"Copies of the SOFTWARE PRODUCT may not be
  distributed for profit either on a standalone basis or included as part
  of your own product."* This site is a commercial, ad-monetized product
  — embedding even Webdings in this Docker image would violate that
  clause directly, license text against license text, no interpretation
  needed.
- **Wingdings was never part of that pack, or any other Microsoft
  freeware distribution, ever.** It has only ever shipped bundled with
  Windows/Office under Microsoft's standard restrictive EULA.
- Real-world confirmation this exact conflict is known and acted on:
  Gotenberg's own repository has [issue #1101](https://github.com/gotenberg/gotenberg/issues/1101),
  "MS Core Fonts violates MIT license," raising precisely this EULA
  conflict for their image. The current upstream Gotenberg Dockerfile
  (fetched directly for this diagnostic, see the phase-1/phase-2 specs)
  installs **no** Microsoft font package at all — Carlito, Caladea,
  Liberation, DejaVu, Noto only. That is consistent with the maintainers
  having moved away from real MS fonts for exactly this reason.

### Verdict

- **A pixel/glyph-faithful correction using the real Wingdings/Webdings
  font: IMPOSSIBLE.** Not a technical limitation — a licensing one, with
  no legal path found, and Gotenberg's own history backs that reading.
- **A partial correction via PUA-to-Unicode remapping: theoretically
  possible, not verified, and substantially more work than volet A** —
  new document-preprocessing code, gated on an unverified third-party
  mapping table, and even if it works, it renders *different* icons (the
  closest Unicode equivalent), not the original Wingdings/Webdings ones.
  This carries exactly the risk flagged going in: swapping empty squares
  for a different flavor of wrong, on foundations not yet confirmed
  solid.
- Given that, and the standing instruction to prefer an assumed limit
  over a shaky fix: **volet C — telling the visitor the truth before
  conversion — is the honest move regardless of whether volet B's partial
  path is ever pursued.**

## Real-document comparison result (2026-09-01)

The user deployed the new service (`gotenberg-fonts-production.up.railway.app`)
and converted their real CV through both services.

- **Fixed:** body-text line wrapping. Liberation Sans Narrow resolved the
  Arial Narrow gap, confirmed as the dominant cause — it affected the
  entire document, not a handful of characters.
- **Not fixed, as predicted — but for a different reason than first
  assumed.** This spec originally attributed the unfixed decorative border
  to the same cause as volet B's Wingdings/Webdings finding (a font/
  licensing gap). **That was wrong, corrected 2026-09-02 after directly
  inspecting the CV's `word/document.xml`.** The two are unrelated,
  independent mechanisms in this file:
  - The header contact icons (location/email/phone) genuinely are
    `<w:sym w:font="Webdings">` — a real font dependency, correctly
    covered by volet B's licensing-wall verdict.
  - **The page border is not font-based at all.** The `sectPr` at the end
    of the document contains:
    ```xml
    <w:pgBorders w:offsetFrom="page">
      <w:top w:val="dashDotStroked" w:sz="24" w:space="24" w:color="auto"/>
      <w:left w:val="dashDotStroked" w:sz="24" w:space="24" w:color="auto"/>
      <w:bottom w:val="dashDotStroked" w:sz="24" w:space="24" w:color="auto"/>
      <w:right w:val="dashDotStroked" w:sz="24" w:space="24" w:color="auto"/>
    </w:pgBorders>
    ```
    No `w:art` attribute is present, so this isn't one of Word's bitmap
    "art" page borders either — `dashDotStroked` is one of the ~30 named
    line styles in the OOXML `ST_Border` enumeration, a pure vector-stroke
    instruction with zero dependency on any font, licensed or not.
  - **Confirmed empirically, not just from the XML:** the user tested the
    same CV through LibreOffice on a Windows machine that has the real
    Wingdings and Webdings fonts installed. Result: the three header icons
    rendered correctly (font dependency resolved), but the border still
    rendered as a plain double black line instead of the dash-dot-stroke
    pattern — proof, independent of the XML reading, that the border's
    defect has nothing to do with font availability.
  - LibreOffice implements `pgBorders` and offers `dashDotStroked` as a
    selectable line style, but its renderer for this and other complex
    line-art border styles is known to be imprecise — see upstream
    [LibreOffice Bug 117354, "Unable to produce double-line page
    borders"](https://bugs.documentfoundation.org/show_bug.cgi?id=117354).
    No font fix, real or licensed, could ever have corrected this border;
    it is a rendering-engine gap, not a font-substitution gap. Still
    accepted as a standing limitation of the LibreOffice route — see the
    engine-alternatives research this correction is drawn from — not
    pursued further in this image.

One correction to this spec: the "no other env vars are required" claim
in volet A's deploy notes was wrong. The real deployment needed **9**
environment variables, not 2 — the healthcheck failed on the missing
`PORT` var specifically. Corrected in `services/gotenberg/RAILWAY.md`
(new file, point 1 below) with the full, verified list.

## Point 2 — cutover procedure (not executed here — the user changes the variable)

**Variable to change:** `GOTENBERG_URL` on Vercel (the same variable
`app/api/convert-to-pdf/route.ts` and `app/api/convert-html-to-pdf/route.ts`
both already read — no code change needed for the cutover itself).
`GOTENBERG_USERNAME`/`GOTENBERG_PASSWORD` do NOT need to change, since the
new Railway service was configured with the same Basic Auth credentials
as the existing one.

**Recommended order — Preview before Production:**
1. Set `GOTENBERG_URL` for the **Preview** environment only, to
   `https://gotenberg-fonts-production.up.railway.app`, on Vercel
   (Project → Settings → Environment Variables → `GOTENBERG_URL` → add/edit
   the Preview-scoped value). Leave Production untouched at this step.
2. Trigger a preview deployment (push any branch, or redeploy the current
   one from the Vercel dashboard) and run the test list below against
   that preview URL.
3. Only once every test below looks right: change `GOTENBERG_URL` for
   **Production** to the same new URL, and redeploy production (Vercel
   dashboard → Deployments → latest → "Redeploy" — changing an env var
   alone does not retroactively affect an already-built deployment).
4. Re-run the same test list against the live production domain.

**Tests — all 5 tools, both before promoting to Production and again after:**

| Tool | Page | What to check |
|---|---|---|
| Word to PDF | `/tools/pdf-tools/word-to-pdf` | Upload the real CV — confirm line wrapping now matches the "new service" comparison PDF; confirm the Wingdings/Webdings header icons still show as blank boxes (expected, unrelated to this cutover) and the new honesty banner appears (once point 3 ships) |
| Excel to PDF | `/tools/pdf-tools/excel-to-pdf` | Upload a real .xlsx with some formatting (borders, number formats) — confirm it still converts cleanly |
| PowerPoint to PDF | `/tools/pdf-tools/ppt-to-pdf` | Upload a real .pptx — confirm slides render, confirm a "Calibri Light" title placeholder (if the file has one) now uses Carlito correctly |
| EPUB to PDF | `/tools/pdf-tools/epub-to-pdf` | Upload a real .epub — this tool calls `/api/convert-html-to-pdf` (Chromium, not LibreOffice) which also points at `GOTENBERG_URL`; confirm the new image's Chromium variant handles it (the new image is the "full" variant — Chromium + LibreOffice — same as production, not a LibreOffice-only build, so this should need no special handling, but it's the one path not otherwise exercised by the CV/xlsx/pptx tests above) |
| MOBI to PDF | `/tools/pdf-tools/mobi-to-pdf` | Same as EPUB — also routes through `/api/convert-html-to-pdf` |

**Rollback (if anything regresses):** change `GOTENBERG_URL` back to the
existing production value (`https://gotenberg-production-7de3.up.railway.app`)
on whichever environment(s) were changed, then redeploy the same way as
step 3 above. The old service was never touched or stopped, so this is
immediate and complete — no data or state to reconcile either direction.
