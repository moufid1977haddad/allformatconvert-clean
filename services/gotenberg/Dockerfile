# Derived from the official Gotenberg image (Chromium + LibreOffice, same
# variant the production service on Railway runs -- confirmed via that
# service's own /health response reporting both chromium and libreoffice as
# up). Pinned by tag AND digest -- a floating tag (:8, :latest) would
# silently move underneath us on a rebuild, and even an exact tag like
# :8.36.0 can be repointed upstream; the digest can't. Verified live
# against Docker Hub's registry API on 2026-09-16 (manifest-list digest,
# so the platform-appropriate image is still selected per architecture).
#
# This is a NEW, separate service -- it does not touch, rebuild, or replace
# the Gotenberg instance currently serving Word/Excel/PowerPoint/EPUB/MOBI/
# HTML to PDF in production. See FONTS.md for what's added and why,
# RAILWAY.md for deploy settings, and
# docs/specs/2026-09-01-office-pdf-fidelity-phase2.md for the font-fidelity
# diagnosis that originally motivated this image. The versioning itself
# (this file pinning tag+digest) is a separate, independent goal: today the
# production Gotenberg service runs the floating public image with no
# pinned version at all -- see docs/audit/RAPPORT-gotenberg-versionne.md.
FROM gotenberg/gotenberg:8.36.0@sha256:87c16b9f364279d321bc9772d31fa58aa6abe036423c270698bd636c3a8e9466

USER root

# Arial Narrow has no correct substitute in the base image -- confirmed by
# converting a real user document (a resume, 100% of its body text set in
# Arial Narrow) through the current production service and inspecting the
# embedded output font: it silently resolves to Carlito (Calibri's
# substitute), which is not a condensed design at all. Liberation Sans
# Narrow is the actual open, metric-compatible replacement -- packaged by
# Debian itself as fonts-liberation-sans-narrow (present in trixie, the
# same Debian release this image is built on), licensed GPLv2 with Red
# Hat's font exception (verified against the font's own License.txt, not
# assumed -- see FONTS.md). Installed via apt like every other font
# already in the base image, not embedded by hand.
RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends fonts-liberation-sans-narrow \
    && rm -rf /var/lib/apt/lists/*

# Segoe UI is Windows-only and unlicensed for redistribution, so the base
# image substitutes Noto Sans, which is noticeably wider: a slide title set
# in Segoe UI wrapped onto a second line and was hidden behind the shape
# placed over it (docs/audit/RAPPORT-fidelite-corrections.md, D2). Selawik
# is Microsoft's own open replacement (github.com/microsoft/Selawik, SIL OFL
# 1.1 -- commercial redistribution and bundling permitted, files must stay
# unmodified). Measured against the real Segoe UI: identical advance widths
# for 93/93 tested glyphs, regular and bold; NOT kerned like Segoe UI (the
# upstream README says so). No apt package exists, so the two TTFs are
# vendored under fonts/selawik/ (provenance in SOURCE.md) and their SHA-256
# is verified at build time -- a mismatch fails the build.
COPY fonts/selawik/ /tmp/selawik/
RUN cd /tmp/selawik \
    && sha256sum -c SHA256SUMS \
    && install -d /usr/local/share/fonts/selawik /usr/share/doc/selawik \
    && install -m 0644 selawk.ttf selawkb.ttf /usr/local/share/fonts/selawik/ \
    && install -m 0644 OFL-LICENSE.txt /usr/share/doc/selawik/copyright \
    && fc-cache -f \
    && rm -rf /tmp/selawik

# The base image already ships Carlito/Caladea (Calibri/Cambria's
# metric-compatible substitutes) via fonts-crosextra-carlito/-caladea --
# confirmed empirically in phase 1 by inspecting the embedded fonts in real
# conversions through the production service, not assumed from the vendor
# Dockerfile. What's missing is a name: "Calibri Light" (the distinct font
# name Office themes use for title/heading placeholders) isn't in
# LibreOffice's own built-in font-substitution table the way plain
# "Calibri" is, so it falls through past Carlito to a generic default
# (LiberationSans) instead. See FONTS.md for the full reasoning.
#
# This is a name-level fontconfig substitution rule, not a new font file --
# no new font is embedded or redistributed by this layer.
# fontconfig reads conf.d/ in lexicographic filename order; the ecosystem
# convention is a zero-padded 2-digit prefix (10-, 20-, ..., 90-) so a
# 3-digit "100-" would actually sort BEFORE "20-" as a string, not after.
# 99- keeps this rule loading last (highest-numbered, applied after any
# other conf.d rule), which combined with binding="strong" in fonts.conf
# makes the ordering doubly explicit rather than relying on one or the
# other alone.
COPY fonts.conf /etc/fonts/conf.d/99-office-font-substitutions.conf

USER gotenberg

# Basic Auth requires BOTH the GOTENBERG_API_BASIC_AUTH_USERNAME/PASSWORD
# env vars AND this flag -- the env vars alone do nothing (confirmed
# against Gotenberg's own configuration docs). Baked into the image's CMD
# rather than left to a Railway start-command override, so this service is
# never accidentally left open regardless of how it's deployed.
CMD ["gotenberg", "--api-enable-basic-auth"]
