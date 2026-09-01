# Derived from the official Gotenberg image (Chromium + LibreOffice, same
# variant the production service on Railway runs -- confirmed via that
# service's own /health response reporting both chromium and libreoffice as
# up). Version pinned to an exact release, never a floating tag (:8, :latest
# would silently move underneath us on a rebuild).
#
# This is a NEW, separate service -- it does not touch, rebuild, or replace
# the Gotenberg instance currently serving Word/Excel/PowerPoint/EPUB/MOBI
# to PDF in production. See FONTS.md for what's added and why, and
# docs/specs/2026-09-01-office-pdf-fidelity-phase2.md for the
# diagnosis this responds to.
FROM gotenberg/gotenberg:8.36.0

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
