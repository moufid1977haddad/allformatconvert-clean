# media-processing

ffmpeg video/audio service for `video-compressor` and `video-converter` (and the
shared, browser-direct upload path later used by the Office routes — see
`docs/audit/RAPPORT-video-architecture.md`). Built to be deployed as its own
Railway service, on the model of `services/background-removal`.

**Status (20 septembre 2026): code + 57 end-to-end tests done; NOT deployed.**
Deploying needs the owner (Railway access, and a secret only the owner generates).
Until `NEXT_PUBLIC_MEDIA_SERVICE_URL` is set on Vercel, the two tools keep
running their previous in-browser version, unchanged.

## Why the browser talks to this service directly

A video can never pass through a Vercel function (measured platform ceiling
~4.4 MB). The market leader (FreeConvert) does the same thing: an API call
creates a job, then a **chunked, resumable upload goes straight to the
processing node**; CloudConvert uploads straight to its storage host. Here:

1. Browser → `POST /api/media/ticket` (site, after its own rate limit) → a
   **signed, one-job, 15-minute ticket** (`lib/media/ticket.js`).
2. Browser → this service, `Authorization: Bearer <ticket>`: create job, `PUT`
   the file in 8 MiB chunks (retried, resumable), `start`.
3. Real progress by polling; then a single download of the result.

The service **never accepts an unsigned request** (HMAC-SHA256, constant-time
compare, expiry, one job id per ticket).

## API

| | |
|---|---|
| `GET /health` | public, `{"status":"ok"}` |
| `POST /v1/jobs` | create (`{op: convert\|compress, size, params}`), ticket required |
| `PUT /v1/jobs/<id>/chunks/<n>` | raw chunk bytes; idempotent, exact length enforced |
| `POST /v1/jobs/<id>/start` | assemble, validate as media, queue (`503 busy` when the line is full; the upload is kept, retry) |
| `GET /v1/jobs/<id>` | `uploading\|queued\|processing\|done\|error`, real `progress`, `queuePosition` |
| `GET /v1/jobs/<id>/result` | streams the output; **deleted after one complete download** |
| `DELETE /v1/jobs/<id>` | cancels (kills ffmpeg) and deletes everything |

`convert` targets: mp4, m4v, mov, mkv, flv, ts, 3gp, webm, avi, wmv, ogv, mpg,
gif, and audio-only mp3, m4a, wav, ogg, opus, flac. `compress`: H.264 MP4 with
level `light|balanced|strong` and optional `maxHeight`. Input: anything ffmpeg
decodes.

## Privacy and safety (each point has a test in `tests/run_tests.py`)

- Input deleted **as soon as processing ends**; output deleted after the first
  full download or after `MEDIA_JOB_TTL_SECONDS`; a sweeper removes abandoned
  jobs; the work directory is wiped at every start.
- No filename ever reaches ffmpeg or a log (fixed `input.bin` / `output.bin`);
  logs carry only operation, size bucket, status, seconds.
- ffmpeg runs with `-protocol_whitelist file`, `-map_metadata -1`, and the
  demuxers that open other files or sockets (hls, concat, ffconcat, dash, sdp,
  rtsp, rtp, tee, lavfi) are refused at probe time.
- All option values come from allowlists, never from request text.
- Hard per-job time limit (`MEDIA_FFMPEG_TIMEOUT_SECONDS`), size and duration
  limits, free-disk check, no empty/partial output ever reported as success.
- Restrictive CORS: only the origins in `ALLOWED_ORIGINS`.

## Variables (ALL required, no default — the process refuses to start without them)

| Variable | Production value proposed | Notes |
|---|---|---|
| `MEDIA_TICKET_SECRET` | *(owner generates, see below)* | same value on Vercel |
| `ALLOWED_ORIGINS` | `https://www.onlineconvertools.com` | exact origins, comma separated |
| `MEDIA_MAX_CONCURRENT_JOBS` | `2` | simultaneous ffmpeg processes; size to the vCPUs |
| `MEDIA_MAX_QUEUED_JOBS` | `10` | further jobs allowed to wait |
| `MEDIA_MAX_FILE_BYTES` | `1073741824` | 1 GiB |
| `MEDIA_MAX_DURATION_SECONDS` | `7200` | 2 h |
| `MEDIA_JOB_TTL_SECONDS` | `900` | 15 min |
| `MEDIA_FFMPEG_TIMEOUT_SECONDS` | `1500` | 25 min per run |
| `MEDIA_WORK_DIR` | `/tmp/media-jobs` | ephemeral disk |
| `MEDIA_FFMPEG_PATH` | `/usr/local/bin/ffmpeg` | installed by the Dockerfile |
| `MEDIA_CHUNK_BYTES` | `8388608` | 8 MiB |

**Generate the secret without ever displaying it** (PowerShell; it goes straight to the clipboard, then paste it as `MEDIA_TICKET_SECRET` in Railway AND in Vercel):

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) | Set-Clipboard
```

Vercel-side variables (`MEDIA_TICKET_SECRET` as a *sensitive* variable, plus
`MEDIA_TICKET_MAX_BYTES=1073741824`, `MEDIA_JOBS_PER_HOUR_PER_IP`,
`MEDIA_JOBS_PER_DAY_PER_IP`, and the public `NEXT_PUBLIC_MEDIA_SERVICE_URL`) are
listed in the runbook of the report.

## Local test

```
cd services/media-processing
python -m venv .venv && .venv/Scripts/pip install flask==3.1.3
.venv/Scripts/python tests/run_tests.py <path to ffmpeg> <dir containing s30.mp4>
```
The tests start real servers on 127.0.0.1 and use a throwaway in-memory key.

## Licences (checked 2026-09-19)

ffmpeg static 7.0.2 (GPLv3 build: libx264, libvpx, libopus, libtheora, libmp3lame,
libvorbis). The GPL binary is **run on our server and never distributed** to
visitors, which is what the GPL's distribution clauses are about. H.264 (x264):
no licence fee for free internet video at this scale. Flask (BSD-3), gunicorn (MIT).
