# background-removal

Minimal HTTP service wrapping IS-Net general-use (Apache-2.0) for background
removal. Built to be deployed as its own Railway service, separate from the
main site. Not wired into `/api/remove-bg` or any page of the site — that
integration is a later phase.

Measurements this design is based on: `docs/audit/RAPPORT-detourage-serveur.md`
(~2.4 s/image, ~1.7 GB RAM, licence check, pixel-identical to a browser run)
and `docs/audit/RAPPORT-detourage-filtre-sujet.md` (the "largest connected
component" filter, and Railway's Serverless/sleep billing).

## API

- `GET /health` — `{"status": "ok"}`, always, without touching the model.
- `POST /remove-background` — request body is the raw image bytes (not
  `multipart/form-data`; there is deliberately no filename field anywhere in
  this protocol — see "No filenames in logs" below). Response is a PNG with
  an alpha channel, or a small JSON error body (see "Error handling").

## The model file — download-at-build, not committed to git

**Decision: downloaded during `docker build`, verified against a pinned
SHA256 checksum, never stored in the git repository (not even via Git LFS).**

Why not commit it (with or without LFS):

- At 178,648,008 bytes (~170 MB), it exceeds GitHub's 100 MB per-blob limit
  for plain git, so plain commit is not an option at all.
- Git LFS would work, but Railway's build step for a repo-sourced service
  clones the repo itself; whether that clone runs LFS's smudge filter
  (fetching the real binary instead of a pointer file) is not something
  documented with enough certainty to bet a model file on without an actual
  deploy to test it against — and a silent LFS-pointer-instead-of-model
  failure would be a much worse failure mode (garbage bytes fed to
  onnxruntime) than a build that fails loudly.

Why download-at-build instead, and why the checksum is not optional:

- The exact file this was measured against was independently downloaded
  and hashed **three times** across this project's audit chantiers,
  including once specifically for this decision (2026-09-14), all three
  landing on the same digest:

  ```
  sha256:60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a
  ```

  Correction du 14/09/2026 : les trois vérifications précédentes avaient
  transcrit ce digest en le tronquant d'un caractère (`...c0d964` au lieu
  de `...c0d964a`, 63 caractères hex au lieu de 64) -- non détecté avant le
  premier déploiement réel sur Railway, qui a échoué la vérification de
  somme de contrôle avec ce digest tronqué. Recalculé directement en local
  (`sha256sum`) sur le fichier réellement téléchargé depuis l'URL ci-dessus.

  This exact digest is hardcoded in `Dockerfile` and checked by
  `scripts/download_model.py` (stdlib only, no extra dependency) after
  every download. A mismatch — corrupted transfer, or the URL now serving
  a different file than the one this service was validated against — fails
  the build immediately, before a single byte of the wrong model reaches
  production.

- **What happens the day the URL disappears:** the Docker build fails at
  the download step. Railway's deploy fails cleanly; the previous working
  deployment keeps serving traffic (Railway does not cut over until a new
  deploy succeeds). Nothing silently degrades — this is the opposite
  failure mode from remove.bg's quota running out unnoticed. The source is
  a GitHub Releases asset on `danielgatis/rembg`, tag `v0.0.0`, which is
  the same de-facto model mirror already relied on by `rembg` (a project
  with real install-base, notable if it broke) and used throughout this
  project's own measurement chantiers without incident. That does not make
  it permanent. If the URL does go away, the fix is to re-host the exact
  same bytes — the checksum above is exactly what makes "the exact same
  bytes" a checkable fact instead of a hope — somewhere this project
  controls (e.g. a GitHub Release asset on *this* repo, which does not hit
  git's blob-size limit since Releases assets are not git objects) and
  update the URL in `Dockerfile`. That re-hosting was not done pre-emptively
  as part of this phase, to avoid publishing a new public artifact without
  it being asked for; it is the documented first move if this URL ever
  breaks.

## Service requirements and how they're met

- **In-memory only, never written to disk.** The request body is read with
  `request.get_data()` (bytes in memory), decoded with
  `PIL.Image.open(io.BytesIO(...))`, and the result is written to another
  `io.BytesIO()` and streamed back with `send_file`. The model weights file
  is read from the container's own filesystem (that is not "the image"
  the requirement refers to). See `app/main.py`.
- **No filenames in logs.** The upload is read from the raw POST body, not
  `multipart/form-data` — there is no filename field anywhere in this
  protocol to begin with, so none can leak into a log line.
- **No image content in logs.** Nothing in `app/main.py` ever logs
  `request.get_data()`, the decoded image, or the result. The only
  exception-path logging (`log.exception(...)`) logs Python's own
  traceback — file/line/exception message — never image bytes; PIL and
  onnxruntime error messages describe shapes/formats, not pixel data.
  gunicorn's access log format is set explicitly to `time, method, path,
  status` (`--access-logformat '%(t)s %(m)s %(U)s %(s)s'`), deliberately
  excluding referrer/user-agent as an extra margin.
- **Malformed request → clear error, never a raw stack trace.** Flask's
  debug traceback page is never reachable in this deployment (no
  `debug=True` anywhere). `HTTPException` (404, 413, wrong method, ...) is
  translated to a small JSON body using only its own safe `name`/
  `description`. Any other exception is caught by a catch-all handler,
  logged internally, and answered with a generic
  `{"error": "internal_error", ...}` — the client never sees a traceback.
- **No silent fallback values.** `PORT` is read with `os.environ["PORT"]`
  (not `.get(..., default)`) — Railway always injects it; if it were ever
  missing, the service should fail to start, not silently bind to a guessed
  port.

## Subject-selection filter

Every mask is passed through `infer.keep_largest_connected_component`
before compositing — unconditionally, not a flag. This is the heuristic
measured in `docs/audit/RAPPORT-detourage-filtre-sujet.md`: it repairs the
one real defect found across the 6 test photos (a secondary object kept
alongside the main subject) and does not degrade any of the other five.

## Local testing

```
cd services/background-removal
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
# place a real isnet-general-use.onnx at models/isnet-general-use.onnx
# (verify its sha256 against the one pinned in Dockerfile first)
PORT=8080 .venv/Scripts/python -m app.main
curl http://127.0.0.1:8080/health
curl -X POST --data-binary @photo.jpg http://127.0.0.1:8080/remove-background -o out.png
```
