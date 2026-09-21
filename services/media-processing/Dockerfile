# Base image pinned by tag AND digest -- the same image, digest and verification
# as services/background-removal (python:3.11.6-slim-bookworm, linux/amd64,
# verified from docker-library/repo-info on 2026-09-14).
FROM python:3.11.6-slim-bookworm@sha256:d1053354624536b044162aaab1e418bd000ea35184fb1ae098ab3166b1072e72

WORKDIR /app

# --- ffmpeg: static build, pinned tag AND checksum ---------------------------
# BtbN/FFmpeg-Builds, release tag autobuild-2026-08-31-13-27 (month-end builds are
# kept by that project; the tag is immutable), ffmpeg n8.1.2, linux64 GPL static.
# Chosen on 2026-09-20 over the previous johnvansickle 7.0.2 build because it embeds
# SVT-AV1 (AV1 in practical time: 26 s for 30 s of 1080p versus ~250 s with libaom)
# next to libx265, libx264, libvpx, libtheora, opus, AMR-NB. The sha256 below was
# computed on the file actually downloaded on 2026-09-20 (125,758,156 bytes) and is
# the same digest GitHub publishes for that asset. A mismatch fails the build:
# nothing but these exact bytes ever reaches production. Same "download at build,
# verify, never trust" rule as the background-removal model.
# Licence: GPLv3 -- the binary runs on the server and is never distributed to
# visitors (see README).
COPY scripts/install_ffmpeg.py scripts/install_ffmpeg.py
RUN python scripts/install_ffmpeg.py       "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-08-31-13-27/ffmpeg-n8.1.2-50-g1a748fe2cd-linux64-gpl-8.1.tar.xz"       "c733b4b2951e5957e15505f788b2c65a7a41b6da4b289e295852cc38079b4d2b"       "/usr/local/bin/ffmpeg"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/

EXPOSE 8080

# ONE process with threads: the job registry lives in memory, so several
# worker processes would not see each other's jobs. Upload chunks are handled
# by request threads; conversions run in their own worker threads (ffmpeg
# subprocesses), bounded by MEDIA_MAX_CONCURRENT_JOBS.
# Every MEDIA_* variable is REQUIRED (no defaults): see README.md, "Variables".
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 1 --threads 16 --timeout 300 --access-logfile - --access-logformat '%(t)s %(m)s %(U)s %(s)s' app.main:app"]
