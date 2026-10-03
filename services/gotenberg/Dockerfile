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
# P28 (04/10): 8.37.0 -- digest read from Docker Hub's registry API on 2026-10-04 (manifest list). Measured against
# 8.36.0 on 59 documents before the switch (docs/audit/RAPPORT-p28-gotenberg-04-10.md): it restores libreoffice-math,
# which 8.30-8.36 had dropped, so Word equations (Office Math, Equation 3.0/MathType, LibreOffice Math) were lost.
FROM gotenberg/gotenberg:8.37.0@sha256:f29984bd1e226bf1b93ba90af06000afa8b315853e99d27b9aaa41b93f15c769

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

# P29 (04/10): Chromium 152 (the one Gotenberg 8.37 ships) does not fix CVE-2026-87491 (V8, exploited in the wild,
# fixed in Chrome 153). Gotenberg installs Debian's own chromium package, and Debian's security archive already has
# the fixed build (security-tracker.debian.org: trixie fixed in 153.0.8010.47-2~deb13u1, DSA-6506-1), so the image
# takes it now instead of waiting for a Gotenberg release. Pinned like the base image: exact files from
# snapshot.debian.org (the permanent copy of the security archive -- security.debian.org drops a version once it is
# superseded), checked by SHA-256 (their SHA-1 matches Debian's snapshot records); amd64 only, like our Railway hosts.
# Measured on gotenberg-fonts before the switch: the 61 documents of scripts/p27/gotenberg-compare.mjs and the probes
# of scripts/p26/gotenberg-probe.mjs (docs/audit/RAPPORT-p29-securite-chromium-04-10.md). To move to a newer
# Debian build: same three values, same bench.
ARG CHROMIUM_DEB_VERSION=154.0.8037.92-1~deb13u1
ARG CHROMIUM_DEB_BASE=https://snapshot.debian.org/archive/debian-security/20261001T172817Z/pool/updates/main/c/chromium
RUN cd /tmp \
    && curl -fsSL -o chromium.deb "$CHROMIUM_DEB_BASE/chromium_${CHROMIUM_DEB_VERSION}_amd64.deb" \
    && curl -fsSL -o chromium-common.deb "$CHROMIUM_DEB_BASE/chromium-common_${CHROMIUM_DEB_VERSION}_amd64.deb" \
    && echo "ba20f2bf959cc302694147fb4d881586c7b41688c5dd5b1555f560732733e3d5  chromium.deb" | sha256sum -c - \
    && echo "ed25b5290168e9775641864aa6f831b15fc53f57e63b30dcc0256d6588fa0831  chromium-common.deb" | sha256sum -c - \
    && apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends ./chromium-common.deb ./chromium.deb \
    && rm -rf /var/lib/apt/lists/* /tmp/chromium.deb /tmp/chromium-common.deb \
    && /usr/bin/chromium --version | grep -F "${CHROMIUM_DEB_VERSION%%-*}" \
    && bash /opt/gotenberg/capture-version.sh "$GOTENBERG_VERSIONS_DIR_PATH" chromium /usr/bin/chromium --version

# P29: Gotenberg starts Chromium through this launcher (V8 without JIT, no API credentials in its environment) --
# the reasons are in the file itself.
COPY --chmod=0755 chromium-launcher /usr/local/bin/chromium-launcher
ENV CHROMIUM_BIN_PATH=/usr/local/bin/chromium-launcher

# P29, after the independent review: --chromium-disable-javascript is a setting of each page Gotenberg opens
# (DevTools Emulation.setScriptExecutionDisabled), and a cross-site https frame of an uploaded page still ran its script
# (measured: scripts/p29/js-probe.mjs, case xsiteframe). Chromium's own enterprise policy blocks JavaScript in the whole
# browser, every frame and process included, and turns off its built-in PDF viewer (PDFium, which has its own
# JavaScript) for PDFs embedded in a page. Debian's chromium reads managed policies from this directory.
COPY chromium-policy.json /etc/chromium/policies/managed/onlineconvertools.json

USER gotenberg

# Basic Auth requires BOTH the GOTENBERG_API_BASIC_AUTH_USERNAME/PASSWORD
# env vars AND this flag -- the env vars alone do nothing (confirmed
# against Gotenberg's own configuration docs). Baked into the image's CMD
# rather than left to a Railway start-command override, so this service is
# never accidentally left open regardless of how it's deployed.
# P29 (04/10): --chromium-disable-javascript -- no page script ever runs in our Chromium: none of our tools needs one
# (URL to PDF already strips every script and forbids them by a Content-Security-Policy, lib/urlFetch/snapshot.mjs;
# Text, Markdown, EPUB and MOBI to PDF build script-free HTML), and an uploaded HTML file is untrusted input printed by
# a Chromium without sandbox. Measured: 0 of 18 ways to run a script (scripts/p29/js-probe.mjs), 15 of 18 before.
CMD ["gotenberg", "--api-enable-basic-auth", "--chromium-disable-javascript"]
