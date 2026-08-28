# pdf-tools-service

A small API service providing:
- `POST /v1/repair` -- fixes PDFs with damaged internal structure (qpdf first, Ghostscript fallback).
- `POST /v1/pdfa` -- converts to PDF/A with Ghostscript, then validates with veraPDF; only returns a file if veraPDF confirms compliance.
- `GET /health` -- reports whether Ghostscript, qpdf, and veraPDF are all actually runnable.

No PDF library does the real work here -- these are the real CLI tools (Ghostscript, qpdf, veraPDF), invoked as child processes. See the Dockerfile for how they're installed.

## Why this exists

Two of the site's tools (PDF Repair, PDF to PDF/A) need tools that don't run in a browser. This service runs as a second Railway service in the same project as Gotenberg, built from this repo's `services/pdf-tools/` directory. The site's own Next.js API routes (`app/api/pdf-repair`, `app/api/pdf-to-pdfa`) call it server-side with an API key -- the site is just this service's first client, not a special caller.

## Request/response shape

Both endpoints take `multipart/form-data` with a `file` field (and `/v1/pdfa` optionally takes a `conformance` field: `1b`, `2b`, or `3b`, default `2b`) and an `X-API-Key` header. Responses are JSON, not raw PDF bytes -- the repaired/converted file comes back as a base64 string in a `file` field, alongside a structured report (repair method + warnings + page count, or veraPDF's compliance verdict + failed rules). A file is only ever included when the operation actually succeeded.

## Environment variables

| Var | Purpose |
|---|---|
| `PORT` | Listen port (Railway sets this automatically). |
| `API_KEYS` | JSON object: `{"<key>": {"name": "site-frontend", "monthlyQuotaRequests": 100000}}`. Requests with an unlisted key get 401. Omit `monthlyQuotaRequests` for no quota. |
| `ALLOWED_ORIGINS` | Comma-separated list of origins allowed to call this from a browser (CORS). Server-to-server calls (what the site's own proxy routes do) aren't subject to CORS at all -- this only matters for a browser calling `/v1/*` directly. |
| `MAX_FILE_SIZE_BYTES` | Default 50MB. |
| `REQUEST_TIMEOUT_MS` | Default 60000. A request that runs past this is aborted (500-series response), its child process killed, and its temp files still cleaned up. |
| `GS_BIN`, `QPDF_BIN`, `VERAPDF_BIN` | Binary names/paths. Default to `gs`, `qpdf`, `verapdf` (correct for the Dockerfile's Debian image). Override locally for testing on another OS. |
| `DEFAULT_PDFA_FLAVOUR` | Default `2b`. |

## Known simplifications (not a finished commercial product yet)

- **Quota counting is in-memory and resets on every deploy/restart.** Fine while the only real caller is our own site (one key, effectively unlimited in practice). A durable, restart-proof store is needed before a second (paying) API customer exists.
- **A request that's authenticated but rejected for being oversized still counts against quota** (auth happens before the size check). Simple, but arguably unfair to a real customer -- revisit if this becomes a real concern.
- **Usage metrics are structured JSON lines to stdout** (timestamp, API key name, endpoint, bytes in/out, duration, verdict -- never content, never filenames), viewable in Railway's log viewer. This is an audit trail, not a queryable dashboard.
- No accounts, no billing, no self-serve key issuance -- keys are provisioned by hand via the `API_KEYS` env var. Deliberate: the brief was to build the technical foundation, not the business layer.

## Files never persist

Every request gets its own temp directory (`os.tmpdir()/pdftools-req-<uuid>/`), deleted in a `finally` block covering success, failure, and timeout paths. A startup sweep also deletes anything left over from a crash (matched by prefix, older than 1 hour) as a second line of defense. Nothing is ever written outside that per-request directory.

## Local testing without Docker

Ghostscript, qpdf, and veraPDF were installed directly on Windows (not in a container -- Docker/WSL2 aren't available on this machine) to validate the actual CLI invocations, argument handling, and JSON/warning parsing against real binaries and real files. Point the `GS_BIN`/`QPDF_BIN`/`VERAPDF_BIN` env vars at your local binaries' full paths to do the same. The one Windows-specific wrinkle: `verapdf.bat` needs `shell: true` to spawn on Windows (`src/runProcess.js` handles this automatically for any `.bat`/`.cmd` binary, on `win32` only -- the Linux container's `verapdf` launcher is a plain shell script and never hits that branch).

**Important scope of what this proves.** This validates the *logic* -- the command-line flags, the qpdf exit-code handling, the veraPDF JSON schema parsing, the PDFA_def.ps/srgb.icc mechanism, the refusal path -- against the real tools' real behavior, with real files. It does **not** validate the actual Debian/apt invocation: `gswin64c.exe` (Windows) and `gs` (Debian) are different builds, at different versions in principle, found via different `GS_BIN` resolution, and the veraPDF install path here used the Windows `.bat` launcher while the Dockerfile installs via the Linux shell-script launcher into `/opt/verapdf`. **The first real verification of the container image itself happens at the Railway deployment** -- check `/health` immediately after deploying (see the deployment steps) before trusting this in production.

### What was actually tested with real files (2026-08-27/28)

- **`/v1/repair` on genuinely corrupted PDFs** (not fabricated to trivially pass -- built by taking a real, valid, multi-page PDF and damaging it the way real-world corruption actually happens):
  - A **bad `startxref` offset** (the single most common real-world corruption) -- qpdf repaired it, returning its own real warning text ("file is damaged", "xref not found", "Attempting to reconstruct cross-reference table"), correct page count, and content verified byte-correct against the original.
  - A **truncated file** (last 25% of bytes cut, simulating an interrupted save/download) and a **corrupted xref stream** (zeroed compressed bytes) -- both qpdf *and* the Ghostscript fallback genuinely failed on these (`qpdfExitCode: 2`, `ghostscriptExitCode: 1`), and the service correctly reported "too damaged to recover" rather than returning a broken file. This is the honest failure path, not just the happy path.
  - Two real bugs were caught and fixed during this testing: an uncaught Ghostscript spawn error that produced a generic 500 instead of an honest structured failure, and the server's absolute temp-directory path leaking into qpdf's warning text returned to the client (fixed by running every child process with `cwd` set to the request's temp dir and relative filenames).
- **`/v1/pdfa` success path**: a real PDF converted to PDF/A-2b and PDF/A-1b, both verified compliant by veraPDF (144 and 129 rules passed respectively), output content confirmed correct.
- **`/v1/pdfa` refusal path -- proven, not assumed.** Ghostscript's `-dPDFA` conversion turned out to be considerably more thorough than expected: it correctly handled and neutralized transparency (flat alpha and image soft masks), an embedded JavaScript `OpenAction`, AES-256 encryption, and an AcroForm text field -- all of which are real, plausible ways a user's PDF could be incompatible with PDF/A, and all of which Ghostscript's rewrite resolved successfully. The genuine failure that was found: a page sized 20000x20000pt (PDF/A inherits ISO 32000-1's 14400-unit page-size ceiling). Ghostscript converted it "successfully" (exit 0) without resizing the page, and veraPDF correctly caught it -- clause 6.1.13, "page boundaries... shall not be greater than 14400 units", 1 violation. The response was `ok:false`, HTTP 422, **no `file` key present at all** (confirmed programmatically, not just visually), and the metrics log recorded `bytesOut: null, verdict: "non_compliant"`. Temp-directory cleanup was confirmed to still run on this failure path. This is the concrete proof that the tool refuses non-compliant output instead of just producing *a* file.
