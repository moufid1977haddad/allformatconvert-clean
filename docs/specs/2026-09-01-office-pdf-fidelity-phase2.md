# Office→PDF fidelity, phase 2 — volet A (Calibri Light) + real-document test

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
