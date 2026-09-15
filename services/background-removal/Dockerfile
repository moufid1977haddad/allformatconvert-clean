# Base image pinned by tag AND digest (immutable even if the tag is ever
# repointed upstream). Verified live from docker-library/repo-info on
# 2026-09-14: python:3.11.6-slim-bookworm, linux/amd64.
FROM python:3.11.6-slim-bookworm@sha256:d1053354624536b044162aaab1e418bd000ea35184fb1ae098ab3166b1072e72

WORKDIR /app

# All dependencies pinned to an exact version -- see requirements.txt.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Model download + mandatory checksum verification ---------------------
# See README.md ("Le fichier du modele") for why this is a download-at-build
# step rather than a file committed to git, and for what happens the day
# this URL disappears.
COPY scripts/download_model.py scripts/download_model.py
RUN mkdir -p models && \
    python scripts/download_model.py \
      "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx" \
      "models/isnet-general-use.onnx" \
      "60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a"

COPY app/ app/

EXPOSE 8080

# Single worker: matches the ~1.7 GB RAM budget this was sized against
# (docs/audit/RAPPORT-detourage-serveur.md). A second worker would load a
# second copy of the model and roughly double memory use.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 1 --timeout 120 --access-logfile - --access-logformat '%(t)s %(m)s %(U)s %(s)s' app.main:app"]
