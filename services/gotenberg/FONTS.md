# Fonts — origin and license, per font

One real font is added by this repo (Liberation Sans Narrow, below); the
Calibri Light fix is a fontconfig rule only, redirecting a font *name* to
a font already present in the base `gotenberg/gotenberg:8.36.0` image, no
new binary. Both are built into the same image in one build, per the
decision to test both fixes together rather than rebuild twice.

## Already present in the base image (not added by this repo)

| Font | Package | License | Redistributable? |
|---|---|---|---|
| Carlito | `fonts-crosextra-carlito` (Debian) | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) | Yes — OFL explicitly permits bundling/redistribution, including in a Docker image |
| Caladea | `fonts-crosextra-caladea` (Debian) | SIL Open Font License 1.1 | Yes, same as above |
| Liberation Sans/Serif/Mono | `fonts-liberation`, `fonts-liberation2` (Debian) | SIL Open Font License 1.1 | Yes |
| DejaVu | `fonts-dejavu` (Debian) | [Bitstream Vera + public-domain additions license](https://dejavu-fonts.github.io/License.html) | Yes |
| Noto (core, CJK, color emoji) | `fonts-noto-core`, `fonts-noto-cjk`, `fonts-noto-color-emoji` (Debian) | SIL Open Font License 1.1 | Yes |
| OpenSymbol | ships with `libreoffice-writer` et al. (Debian) | Multi-licensed: MPL-2.0, LGPL-3.0, Apache-2.0, CC0-1.0, BSD-3-Clause, SISSL, MIT (per its actual packaging metadata — not a single "LibreOffice license") | Yes |

Origin for all of the above: Debian's official package repository, pulled
by the upstream `gotenberg/gotenberg` Dockerfile's `apt-get install` in its
`common-stage` (verified by reading that Dockerfile directly, not assumed
from Gotenberg's own docs — see the phase 2 spec for the fetch).

## Added by this repo

| Font | Package | License | Redistributable? |
|---|---|---|---|
| Liberation Sans Narrow | `fonts-liberation-sans-narrow` (Debian, present in trixie — the same Debian release `gotenberg/gotenberg:8.36.0` is built on) | GPLv2 with Red Hat's font-embedding exception (verified directly against the font's own `License.txt` in [liberationfonts/liberation-sans-narrow](https://github.com/liberationfonts/liberation-sans-narrow) — not assumed from a summary). The exception exists specifically so embedding the font in a document doesn't GPL-license the document; ordinary GPLv2 terms (keep copyright/license notices, don't claim the "LIBERATION" trademark on a modified version) govern redistributing the font file itself, and explicitly permit commercial redistribution. | Yes |

Dropped from the main `liberation-fonts` project at its 2.00.0 relicense
to OFL 1.1 — its own README says this was "due to licensing problems,"
without detail. Checked what that meant before using it: nothing found
suggests the font itself is unsafe to redistribute — Debian ships it as
an official package today (`fonts-liberation-sans-narrow`, version
`1:1.07.6-4` in trixie/sid), which a distro with Debian's font-licensing
scrutiny wouldn't do for something legally unclean. Read as a
relicensing-consent gap (the OFL move needed sign-off this specific
variant's contributor(s) apparently didn't give), not a legality problem
with the older, still-valid GPLv2 terms it ships under.

The fontconfig rule that routes "Arial Narrow" requests to it is
documented in `fonts.conf`, same mechanism as Calibri Light.

## Wingdings / Webdings / Wingdings 2 / Wingdings 3 — deliberately not added

Researched (see `docs/specs/2026-09-01-office-pdf-fidelity-phase2.md`,
volet B) and not pursued: Wingdings was never part of any Microsoft
freeware distribution, ever. Webdings was, once ("Core fonts for the
Web"), but under a EULA that explicitly forbids distribution "for profit
... as part of your own product" — this site is commercial, so that
license does not permit embedding it here. This is a licensing wall, not
a technical gap, and it's treated as a standing limitation of the product
rather than worked around.

## Re-checked: any other font gap in a real user document?

Yes, once (Arial Narrow, addressed above) — checked by inspecting every
font reference across every XML part of a real user-submitted `.docx`
(body text, styles, numbering/bullet definitions, footnotes, endnotes,
settings, doc properties), not just the body text. Courier New, Arial,
and Calibri also appear (bullet-list definitions) but all three already
have working substitutes already present in the base image (Liberation
Mono, Liberation Sans, Carlito) — confirmed, not assumed, since those are
exactly the substitutions Debian's croscore/Liberation packages exist
for.
