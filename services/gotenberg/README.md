# gotenberg-fidelity (test service, not production)

A second Gotenberg instance, built from this directory, deployed as its own
Railway service alongside the one already serving Word/Excel/PowerPoint/
EPUB/MOBI to PDF for the 5 tools in production. **This service does not
replace or touch that one.** The cutover, if this proves out, is a single
`GOTENBERG_URL` env var change on the site — reversible in seconds by
changing it back.

Why it exists: `docs/specs/2026-09-01-office-pdf-fidelity-phase2.md`
diagnosed real font-substitution gaps in the current service (see that doc
for the full evidence, including tests against a real user document, not
just synthetic ones). This directory is where fixes get proven before
anything is switched over.

## What's in this image vs. the production one

`FROM gotenberg/gotenberg:8.36.0` (pinned exact version — see `Dockerfile`
for why the base image was chosen and what it already includes) plus one
fontconfig rule (`fonts.conf`) that fixes "Calibri Light" resolving to the
wrong substitute font. See `FONTS.md` for the license/origin of every font
in play, including the ones this repo didn't add.

## Deploying this service (for testing only — do not point production at it yet)

1. Railway project `fortunate-manifestation` (same project as the existing
   Gotenberg and pdf-tools services) → New Service → Deploy from the
   GitHub repo → Root Directory: `services/gotenberg`.
2. Environment variables — `GOTENBERG_API_BASIC_AUTH_USERNAME` and
   `GOTENBERG_API_BASIC_AUTH_PASSWORD` (Gotenberg's own native Basic Auth,
   already baked on via `--api-enable-basic-auth` in this image's `CMD` —
   see the Dockerfile). These are Gotenberg's names, not this repo's app-side
   `GOTENBERG_USERNAME`/`GOTENBERG_PASSWORD` (what `.env.local` and the
   Next.js routes use to build the Basic Auth header they send) — set them
   to the same values as the existing service's credentials so both
   services accept the same login. No other env vars are required — this
   image adds nothing else that reads new config.
3. Healthcheck path: `/health` (same as the existing service; confirmed
   live — see the phase 1 spec).
4. Replicas: 1 is enough for a test/comparison service — it isn't taking
   production traffic.

## Testing it

`POST /forms/libreoffice/convert` with a `files` field, Basic Auth from
step 2 — identical request shape to the production service, just a
different `GOTENBERG_URL`. See the phase 2 spec for ready-to-paste
PowerShell commands that convert the same file against both services for
a side-by-side comparison.
