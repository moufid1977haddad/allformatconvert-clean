# Base image pinned by tag AND digest -- the same image, digest and verification
# as services/background-removal (python:3.11.6-slim-bookworm, linux/amd64,
# verified from docker-library/repo-info on 2026-09-14).
FROM python:3.11.6-slim-bookworm@sha256:d1053354624536b044162aaab1e418bd000ea35184fb1ae098ab3166b1072e72

WORKDIR /app

# --- ffmpeg: static build, pinned version AND checksum ----------------------
# johnvansickle.com static build 7.0.2 (amd64). The sha256 below was computed
# on the file actually downloaded on 2026-09-19 (41,888,096 bytes). A mismatch
# fails the build: nothing but these exact bytes ever reaches production.
# Same "download at build, verify, never trust" rule as the background-removal
# model (services/background-removal/README.md). Licence: GPLv3 -- the binary
# runs on the server and is never distributed to visitors (see README).
COPY scripts/install_ffmpeg.py scripts/install_ffmpeg.py
RUN python scripts/install_ffmpeg.py \
      "https://johnvansickle.com/ffmpeg/releases/ffmpeg-7.0.2-amd64-static.tar.xz" \
      "abda8d77ce8309141f83ab8edf0596834087c52467f6badf376a6a2a4c87cf67" \
      "/usr/local/bin/ffmpeg"

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
