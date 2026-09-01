# Fonts — origin and license, per font

This volet (A) adds **zero new font files**. It adds one fontconfig rule
that redirects a font *name* ("Calibri Light") to a font already present in
the base `gotenberg/gotenberg:8.36.0` image. Documented here anyway, for
the same traceability this file will carry once volet B/C add real font
files.

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

## Added by this volet

Nothing. `fonts.conf` is a fontconfig *matching rule*, not a font asset —
it does not embed, ship, or redistribute any font binary. It only changes
which of the already-present, already-licensed fonts above LibreOffice
resolves a specific font name to.

## What volet B/C may add later

If volet B's research finds a real, verifiably redistributable font that
improves Wingdings/Webdings/Symbol coverage, it gets a row in this table
with its own source URL and license text before being added to the
Dockerfile — not after.
