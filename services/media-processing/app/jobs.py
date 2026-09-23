"""Job store, upload assembly, queue and workers.

Lifecycle:  uploading -> (start) -> queued -> processing -> done | error
Files:      <WORK_DIR>/<jid>/chunks/<n>.part  ->  input.bin  ->  output.bin

Privacy / retention rules enforced here:
- the INPUT is deleted the moment processing ends (success, error or cancel);
- the OUTPUT is deleted right after the first complete download, or after
  JOB_TTL_SECONDS, whichever comes first;
- every job directory older than the TTL is removed by a background sweeper,
  so an abandoned upload cannot fill the disk;
- nothing about a file (name, content, metadata) is ever logged: only the
  operation, a size bucket and timings.
"""
from __future__ import annotations

import hashlib
import logging
import math
import os
import queue
import shutil
import threading
import time

from . import config, ffmpeg_ops

log = logging.getLogger("media-processing")

# "stage" = Office / document jobs: the service only RECEIVES the file (same chunked, SHA-256-checked
# upload as video), keeps it for the Vercel route to read server-to-server, then holds the converted
# output that the same route deposits. No ffmpeg, no worker slot. Lifecycle:
#   uploading -> (start) -> staged -> (output deposited) -> done   |   error / deleted
STAGE_OP = "stage"
STAGE_OUTPUTS = {
    "pdf": ("application/pdf", b"%PDF-"),
    "docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", b"PK"),
    # PDF to Excel / PowerPoint (ConvertAPI), deposited by the site's routes: ZIP containers like docx.
    "xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", b"PK"),
    "pptx": ("application/vnd.openxmlformats-officedocument.presentationml.presentation", b"PK"),
    # Image Upscaler: the AI service (services/background-removal, /upscale-staged) deposits its PNG here.
    "png": ("image/png", b"\x89PNG\r\n\x1a\n"),
}


class Job:
    def __init__(self, jid, op, params, size, ext_hint):
        self.jid = jid
        self.op = op
        self.params = params
        self.size = size
        self.total_chunks = max(1, math.ceil(size / config.CHUNK_BYTES))
        self.status = "uploading"
        self.progress = 0.0
        self.error = None
        self.error_code = None
        self.out_ext = None
        self.out_mime = None
        self.out_size = None
        self.attempt = 1          # compress: a stronger level is tried once when the result is not smaller
        self.not_smaller = False  # compress: even the strongest attempt was not smaller than the source
        self.larger = False       # convert: even the strongest step is larger than the source (delivered, flagged)
        self.created = time.time()
        self.touched = time.time()
        self.cancel = threading.Event()
        self.lock = threading.Lock()

    @property
    def dir(self):
        return os.path.join(config.WORK_DIR, self.jid)


_jobs: dict[str, Job] = {}
_registry_lock = threading.Lock()
_queue: "queue.Queue[str]" = queue.Queue()
_queued_order: list[str] = []
_started = False
_start_lock = threading.Lock()


def _bucket(n):
    mb = n / 1048576
    return "<10MB" if mb < 10 else "<100MB" if mb < 100 else "<500MB" if mb < 500 else "500MB+"


def ensure_started():
    global _started
    with _start_lock:
        if _started:
            return
        os.makedirs(config.WORK_DIR, exist_ok=True)
        # A restart loses in-memory state: nothing on disk can be resumed, so wipe it.
        for name in os.listdir(config.WORK_DIR):
            shutil.rmtree(os.path.join(config.WORK_DIR, name), ignore_errors=True)
        for i in range(config.MAX_CONCURRENT_JOBS):
            threading.Thread(target=_worker, name=f"ffmpeg-worker-{i}", daemon=True).start()
        threading.Thread(target=_sweeper, name="sweeper", daemon=True).start()
        _started = True


def get(jid: str):
    with _registry_lock:
        return _jobs.get(jid)


def create(jid, op, params, size, ext_hint):
    """Registers a new job. Returns (job, None) or (None, (code, message))."""
    with _registry_lock:
        if jid in _jobs:
            return None, ("job_exists", "This upload ticket was already used.")
    if size <= 0 or size > config.MAX_FILE_BYTES:
        return None, ("too_large", f"Files up to {config.MAX_FILE_BYTES // 1048576} MB are accepted.")
    free = shutil.disk_usage(config.WORK_DIR).free
    if free < size * 3:
        return None, ("busy", "The service is temporarily out of working space. Please try again in a few minutes.")
    job = Job(jid, op, params, size, ext_hint)
    os.makedirs(os.path.join(job.dir, "chunks"), exist_ok=True)
    with _registry_lock:
        _jobs[jid] = job
    return job, None


def chunk_range(job: Job, n: int):
    """Expected byte length of chunk n."""
    if not 0 <= n < job.total_chunks:
        return None
    start = n * config.CHUNK_BYTES
    return min(config.CHUNK_BYTES, job.size - start)


def received(job: Job):
    d = os.path.join(job.dir, "chunks")
    try:
        return sorted(int(f[:-5]) for f in os.listdir(d) if f.endswith(".part"))
    except FileNotFoundError:
        return []


def store_chunk(job: Job, n: int, stream, expected: int, expected_sha256: str):
    d = os.path.join(job.dir, "chunks")
    tmp = os.path.join(d, f"{n}.tmp")
    final = os.path.join(d, f"{n}.part")
    written = 0
    digest = hashlib.sha256()
    with open(tmp, "wb") as f:
        while True:
            block = stream.read(1 << 20)
            if not block:
                break
            written += len(block)
            if written > expected:
                break
            digest.update(block)
            f.write(block)
    # Exact length AND the sender's own SHA-256: a chunk that arrived altered
    # (a browser bug was found where a sliced Blob sent the wrong bytes) is
    # refused instead of silently producing a corrupt file.
    if written != expected or digest.hexdigest() != (expected_sha256 or "").lower():
        os.remove(tmp)
        return False
    os.replace(tmp, final)
    job.touched = time.time()
    return True


def start(job: Job):
    """Assembles chunks, validates the media, queues the job. Returns (ok, (code, message)|None)."""
    with job.lock:
        if job.status != "uploading":
            return (job.status in ("queued", "processing", "done", "staged")), None
        if not getattr(job, "assembled", False):
            have = received(job)
            if len(have) != job.total_chunks:
                return False, ("incomplete", f"{job.total_chunks - len(have)} chunk(s) still missing.")
            inp = os.path.join(job.dir, "input.bin")
            with open(inp, "wb") as out:
                for n in range(job.total_chunks):
                    p = os.path.join(job.dir, "chunks", f"{n}.part")
                    with open(p, "rb") as part:
                        shutil.copyfileobj(part, out, 1 << 20)
                    os.remove(p)
            if job.op == STAGE_OP:
                job.assembled = True
                job.status = "staged"
                job.touched = time.time()
                return True, None
            info = ffmpeg_ops.probe(inp)
            if info is None:
                _fail(job, "not_media", "This file could not be read as a video or audio file.")
                return False, ("not_media", job.error)
            if info.duration > config.MAX_DURATION_SECONDS:
                _fail(job, "too_long", f"Media up to {config.MAX_DURATION_SECONDS // 60} minutes is accepted.")
                return False, ("too_long", job.error)
            try:
                ffmpeg_ops.build_command(job.op, job.params, info, inp, os.path.join(job.dir, "output.bin"))
            except ValueError as e:
                _fail(job, "bad_request", str(e))
                return False, ("bad_request", job.error)
            job._info = info
            job.assembled = True
        with _registry_lock:
            if len(_queued_order) >= config.MAX_QUEUED_JOBS:
                # Not a failure: the upload is kept so the client can retry start later.
                return False, ("busy", "All conversion slots are busy and the waiting line is full. Please retry in a moment.")
            _queued_order.append(job.jid)
        job.status = "queued"
        job.touched = time.time()
        _queue.put(job.jid)
        return True, None


def store_output(job: Job, stream, ext: str, expected_len: int, expected_sha256: str):
    """Deposit of a stage job's converted file (server ticket only). Returns (ok, (code, message)|None).

    Length and SHA-256 are the sender's own and must match; the first bytes must be the real magic of the
    declared type, so no empty, truncated or mislabelled output can ever be reported as done. The source is
    destroyed the moment the output is safely stored."""
    with job.lock:
        if job.op != STAGE_OP or job.status != "staged":
            return False, ("bad_state", "This job is not waiting for a result.")
        if ext not in STAGE_OUTPUTS:
            return False, ("bad_request", "Unsupported output type.")
        if not 0 < expected_len <= config.MAX_FILE_BYTES:
            return False, ("too_large", "The result is empty or too large.")
        mime, magic = STAGE_OUTPUTS[ext]
        tmp = os.path.join(job.dir, "output.tmp")
        final = os.path.join(job.dir, "output.bin")
        digest = hashlib.sha256()
        written = 0
        head = b""
        with open(tmp, "wb") as f:
            while True:
                block = stream.read(1 << 20)
                if not block:
                    break
                written += len(block)
                if written > expected_len:
                    break
                if len(head) < len(magic):
                    head += block[: len(magic) - len(head)]
                digest.update(block)
                f.write(block)
        if written != expected_len or digest.hexdigest() != (expected_sha256 or "").lower() or not head.startswith(magic):
            os.remove(tmp)
            return False, ("bad_output", "The result arrived incomplete or altered.")
        os.replace(tmp, final)
        job.out_ext, job.out_mime, job.out_size = ext, mime, written
        job.progress = 100.0
        job.status = "done"
        job.touched = time.time()
        _drop_input(job)
        return True, None


def queue_position(job: Job):
    with _registry_lock:
        try:
            return _queued_order.index(job.jid) + 1
        except ValueError:
            return 0


def _fail(job: Job, code: str, message: str):
    job.status = "error"
    job.error_code = code
    job.error = message
    _drop_input(job)
    try:
        os.remove(os.path.join(job.dir, "output.bin"))  # never keep a partial output
    except FileNotFoundError:
        pass


def _drop_input(job: Job):
    for name in ("input.bin",):
        try:
            os.remove(os.path.join(job.dir, name))
        except FileNotFoundError:
            pass
    shutil.rmtree(os.path.join(job.dir, "chunks"), ignore_errors=True)


def cancel_and_delete(job: Job):
    job.cancel.set()
    with _registry_lock:
        if job.jid in _queued_order:
            _queued_order.remove(job.jid)
        _jobs.pop(job.jid, None)
    if job.status != "processing":
        shutil.rmtree(job.dir, ignore_errors=True)
    # while ffmpeg runs it holds the output open: the worker removes the
    # directory itself right after it has killed the process (see _process).


def delete_output(job: Job):
    with _registry_lock:
        _jobs.pop(job.jid, None)
    shutil.rmtree(job.dir, ignore_errors=True)


def _worker():
    while True:
        jid = _queue.get()
        job = get(jid)
        with _registry_lock:
            if jid in _queued_order:
                _queued_order.remove(jid)
        if job is None or job.cancel.is_set():
            continue
        _process(job)


def _process(job: Job):
    inp = os.path.join(job.dir, "input.bin")
    out = os.path.join(job.dir, "output.bin")
    t0 = time.monotonic()
    job.status = "processing"
    job.progress = 0.0
    try:
        # SIZE LADDER. A compression is only worth delivering if it is SMALLER than the source; a
        # conversion should not be LARGER than it. Otherwise the encode is repeated with a stronger
        # setting (compress: the next level; convert: a CRF offset computed from the measured or
        # projected overshoot, at most MAX_ATTEMPTS encodes; an attempt whose projection is far too
        # large is abandoned early). If the last attempt is still not acceptable the service says so
        # instead of hiding it: a compression returns no file (notSmaller); a conversion is delivered
        # and flagged (larger).
        target = job.params.get("target")
        if job.op == "compress":
            level = job.params.get("level", "balanced")
            i = ffmpeg_ops.COMPRESS_LEVELS.index(level)
            plan = [dict(job.params, level=lv) for lv in ffmpeg_ops.COMPRESS_LEVELS[i:i + 2]]
        elif target in ffmpeg_ops.LADDER_TARGETS:
            plan = [job.params] * ffmpeg_ops.MAX_ATTEMPTS
        else:
            plan = [job.params]
        offset = 0
        for n, params in enumerate(plan, start=1):
            job.attempt = n
            job.progress = 0.0
            last = n == len(plan)
            projected = [0.0]

            def abort_check(pct, _out=out, _projected=projected):
                # only convert-ladder attempts that still have a retry left may be abandoned
                if last or job.op != "convert" or pct < ffmpeg_ops.ABORT_AFTER_PCT:
                    return False
                try:
                    _projected[0] = os.path.getsize(_out) / (pct / 100.0)
                except OSError:
                    return False
                return _projected[0] > job.size * ffmpeg_ops.ABORT_SHARE

            args, ext, mime = ffmpeg_ops.build_command(job.op, params, job._info, inp, out, job.size, offset)
            code, cancelled, timed_out, aborted = ffmpeg_ops.run(
                args, ffmpeg_ops.effective_duration(job.op, params, job._info), lambda p: setattr(job, "progress", p), job.cancel.is_set, config.FFMPEG_TIMEOUT_SECONDS, abort_check
            )
            if cancelled:
                shutil.rmtree(job.dir, ignore_errors=True)
                return
            if timed_out:
                _fail(job, "timeout", "The conversion took too long and was stopped. Try a shorter file.")
                break
            if aborted:
                offset = ffmpeg_ops.next_crf_offset(target, offset, projected[0], job.size)
                if os.path.exists(out):
                    os.remove(out)
                continue
            if code != 0 or not os.path.exists(out) or os.path.getsize(out) == 0:
                # Never report success on a missing or empty output.
                _fail(job, "conversion_failed", "This file could not be converted. It may use a codec that cannot be read.")
                break
            size = os.path.getsize(out)
            too_big = size >= job.size * ffmpeg_ops.NOT_SMALLER_RATIO if job.op == "compress" else size > job.size
            if too_big and not last:
                if job.op == "convert":
                    offset = ffmpeg_ops.next_crf_offset(target, offset, size, job.size)
                os.remove(out)
                continue  # try the next, stronger step
            if too_big:
                if job.op == "compress":
                    job.not_smaller = True
                elif target in ffmpeg_ops.LADDER_TARGETS:
                    job.larger = True
            job.out_ext, job.out_mime, job.out_size = ext, mime, size
            job.progress = 100.0
            job.status = "done"
            job.touched = time.time()
            if job.not_smaller:
                job.out_ext = None  # nothing to download: the bigger file is discarded, only the sizes are reported
                try:
                    os.remove(out)
                except FileNotFoundError:
                    pass
            _drop_input(job)  # the source is destroyed as soon as processing is over
            break
    except Exception:
        log.exception("processing crashed (file content never logged)")
        _fail(job, "internal_error", "An unexpected error occurred while converting.")
    finally:
        log.info("job op=%s size=%s status=%s seconds=%.1f", job.op, _bucket(job.size), job.status, time.monotonic() - t0)
        if job.status != "done":
            _drop_input(job)


def _sweeper():
    while True:
        time.sleep(30)
        now = time.time()
        with _registry_lock:
            stale = [j for j in _jobs.values() if now - j.touched > config.JOB_TTL_SECONDS and j.status != "processing"]
        for j in stale:
            cancel_and_delete(j)
        # orphan directories (e.g. jobs dropped from memory)
        try:
            for name in os.listdir(config.WORK_DIR):
                if name not in _jobs:
                    p = os.path.join(config.WORK_DIR, name)
                    if now - os.path.getmtime(p) > config.JOB_TTL_SECONDS:
                        shutil.rmtree(p, ignore_errors=True)
        except FileNotFoundError:
            pass
