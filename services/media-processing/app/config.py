"""All configuration from env vars, NO silent fallback for any of it.

Mirrors services/background-removal/app/config.py: a missing or invalid value
makes the whole process refuse to start (Railway's healthcheck then fails
visibly) instead of serving with a guessed default. Values are documented in
README.md ("Variables") with the ones to use in production.
"""
import os


def _required(name: str) -> str:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        raise RuntimeError(f"[media-processing/config] {name} is missing. Refusing to start: no silent default is used.")
    return raw.strip()


def _required_positive_int(name: str) -> int:
    raw = _required(name)
    try:
        value = int(raw)
    except ValueError:
        value = 0
    if value <= 0:
        raise RuntimeError(f"[media-processing/config] {name} must be a positive integer.")
    return value


# HMAC key shared with the Vercel ticket route (MEDIA_TICKET_SECRET there too).
TICKET_SECRET = _required("MEDIA_TICKET_SECRET").encode()

# Exact browser origins allowed to call this service directly.
ALLOWED_ORIGINS = [o.strip() for o in _required("ALLOWED_ORIGINS").split(",") if o.strip()]

# Simultaneous ffmpeg processes, and how many further jobs may wait.
MAX_CONCURRENT_JOBS = _required_positive_int("MEDIA_MAX_CONCURRENT_JOBS")
MAX_QUEUED_JOBS = _required_positive_int("MEDIA_MAX_QUEUED_JOBS")

# Largest input accepted (bytes) and longest input accepted (seconds).
MAX_FILE_BYTES = _required_positive_int("MEDIA_MAX_FILE_BYTES")
MAX_DURATION_SECONDS = _required_positive_int("MEDIA_MAX_DURATION_SECONDS")

# How long a finished/abandoned job's files may exist, and the hard time limit of one ffmpeg run.
JOB_TTL_SECONDS = _required_positive_int("MEDIA_JOB_TTL_SECONDS")
FFMPEG_TIMEOUT_SECONDS = _required_positive_int("MEDIA_FFMPEG_TIMEOUT_SECONDS")

# Where job files live (ephemeral container disk) and the binary to run.
WORK_DIR = _required("MEDIA_WORK_DIR")
FFMPEG_PATH = _required("MEDIA_FFMPEG_PATH")

# Chunk size the browser must use (bytes). Fixed by the service, echoed to the client.
CHUNK_BYTES = _required_positive_int("MEDIA_CHUNK_BYTES")
