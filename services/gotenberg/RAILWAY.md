# Railway deployment — the 9 environment variables

This is what `README.md`'s original "no other env vars are required" claim
got wrong: a real deployment (2026-09-01) needed all 9 of these, not just
the 2 Basic Auth ones. Names only, per the standing rule for this
repo — never commit real credential/config values. Railway injects a
further set of its own (`RAILWAY_*`, service/project identifiers, etc.)
automatically; those aren't listed here since they're never manually set
or copied between services.

| Variable | Role | Value |
|---|---|---|
| `GOTENBERG_API_BASIC_AUTH_USERNAME` | Gotenberg's own Basic Auth username, checked on every API request. | **Reused** — same value as the existing Gotenberg service, so this site's existing `GOTENBERG_USERNAME`/`GOTENBERG_PASSWORD` app-side request code works against either service unmodified. |
| `GOTENBERG_API_BASIC_AUTH_PASSWORD` | Gotenberg's own Basic Auth password. | **Reused**, same reasoning. |
| `API_ENABLE_BASIC_AUTH` | Turns Basic Auth on at all — the two vars above do nothing without this. This image's `Dockerfile` also bakes `--api-enable-basic-auth` into its `CMD`, which is the same setting via the equivalent CLI flag rather than this env var; the existing service apparently uses the env var form instead of a CMD override. Setting both is redundant but harmless (confirmed no conflict) — keep this var anyway, so the service's config is legible from Railway's dashboard alone, without needing to open the Dockerfile to know Basic Auth is on. | **Reused** — same value/purpose as the existing service (`true`). |
| `PORT` | **The one that broke the first deploy.** Gotenberg always listens on port 3000 — it does not read Railway's own auto-assigned port unless told to. Railway, left to its own defaults, assigns some other port and health-checks *that* one, which nothing is listening on → healthcheck fails. Setting `PORT` yourself overrides Railway's auto-assignment with the port Gotenberg actually uses. **This is the trap: skip this var and the deploy looks successful right up until the healthcheck, which fails with no obvious reason pointing at "port" unless you already know to look.** | **Reused** — same value as the existing service (`3000`, matching Gotenberg's fixed listening port — not a Railway-assigned one). |
| `API_TIMEOUT` | Maximum time Gotenberg allows a single conversion request to run before aborting it. | **Reused** — same value as the existing service, already tuned for real document sizes this site sends. |
| `CHROMIUM_AUTO_START` | Whether the bundled Chromium starts eagerly at container boot vs. lazily on first request. Matters because this image is the "full" variant (Chromium + LibreOffice), same as production. | **Reused**. |
| `LIBREOFFICE_AUTO_START` | Same idea as `CHROMIUM_AUTO_START`, for the bundled LibreOffice/`soffice` process. | **Reused**. |
| `GOTENBERG_GRACEFUL_SHUTDOWN_DURATION` | How long Gotenberg waits for in-flight conversions to finish before shutting down on redeploy/restart, instead of cutting them off mid-request. | **Reused**. |
| `LOG_STD_FORMAT` | Output format for Gotenberg's stdout logs (structured vs. plain), consumed by Railway's log viewer. | **Reused**. |

## Why this file exists

`services/gotenberg/` is only actually reconstructable-without-reading-the-
old-service if every variable it needs is written down somewhere in this
directory. The first real deployment attempt (2026-09-01) proved that
wasn't true yet — `README.md` only listed 2 of the 9, and the deploy
failed at the healthcheck on the missing `PORT` var specifically. This
file is the correction; see `README.md`'s "Deploying this service" section
for the deployment steps, which now point here.

## P30 (04/10) — Chromium in its own Railway project

This image now runs in two roles (`OCT_EDGE_MODE`, read by `edge/main.go`, the `oct-edge` relay that starts Gotenberg):

| Service | Project | Role | Variables |
|---|---|---|---|
| `gotenberg-v2` (production), `gotenberg-fonts` (test) | `fortunate-manifestation` | `front` (default): LibreOffice and the PDF engines here; `/forms/chromium/*` checked against this service's Basic Auth, then relayed, signed, to `OCT_CHROMIUM_URL` (baked in the Dockerfile). Chromium never starts here. | unchanged (the 9 above + the P26 protections) |
| `chromium` | **`oct-chromium-isolated`** (its own project: Railway does not let services of another project reach ours over the private network) | `back`: Chromium only, Gotenberg on 127.0.0.1, only requests signed by the front pass (public key `OCT_TRUSTED_KEYS`, baked in the Dockerfile) | `OCT_EDGE_MODE=back` + copies of gotenberg-v2's `API_TIMEOUT`, `API_DISABLE_DOWNLOAD_FROM`, `API_DOWNLOAD_FROM_DENY_PRIVATE_IPS`, `CHROMIUM_AUTO_START`, `CHROMIUM_DENY_LIST`, `CHROMIUM_DENY_PRIVATE_IPS`, `WEBHOOK_DISABLE`, `WEBHOOK_DENY_PRIVATE_IPS`, `GOTENBERG_GRACEFUL_SHUTDOWN_DURATION`, `LOG_STD_FORMAT`, `PORT` (`scripts/p30/isolated-vars.mjs`). **No credential**: oct-edge refuses to start in `back` if Gotenberg's password is present. |

- The isolated service is deployed with `railway up` from `git archive HEAD:services/gotenberg` plus a `railway.json`
  (healthcheck `/health`, region `sfo`, restart on failure) written in the upload directory only.
- **If Gotenberg's Basic Auth password changes**, the front's signing key changes: recompute the public key with
  `scripts/p30/edge-pubkey.mjs`, put it in `OCT_TRUSTED_KEYS` (Dockerfile) and redeploy all three services, or every
  Chromium tool answers 403.
- Rollback of the whole change: the previous deployment of `gotenberg-v2` (its image started Gotenberg directly, with
  Chromium inside); the isolated project can then be left idle or deleted by the owner.
