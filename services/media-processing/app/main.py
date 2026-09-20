"""Media-processing service: signed, chunked, direct-from-browser uploads and ffmpeg jobs.

Same security model as services/background-removal (see its README): fail-fast
config, constant-time secret comparison, restrictive CORS, small safe JSON
errors (never a traceback), nothing about a file ever logged. The difference is
the credential: instead of one long-lived API key, every request carries a
short-lived ticket signed by the site's Vercel route (see tickets.py), which
authorises exactly one job.

Endpoints (all but /health need `Authorization: Bearer <ticket>`):
  GET    /health
  POST   /v1/jobs                       create the job (JSON: size, op, params)
  GET    /v1/jobs/<id>                  status: uploading|queued|processing|done|error
  PUT    /v1/jobs/<id>/chunks/<n>       raw bytes of chunk n + X-Chunk-Sha256 header (idempotent, resumable)
  POST   /v1/jobs/<id>/start            assemble + queue
  GET    /v1/jobs/<id>/result           stream the output (deleted after a full download)
  DELETE /v1/jobs/<id>                  cancel / delete now
"""
from __future__ import annotations

import logging
import os

from flask import Flask, Response, jsonify, request
from werkzeug.exceptions import HTTPException

from . import config, ffmpeg_ops, jobs, tickets
from .cors import apply_cors

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("media-processing")

app = Flask(__name__)
# A request body is at most one chunk; refuse anything bigger up front.
app.config["MAX_CONTENT_LENGTH"] = config.CHUNK_BYTES + 1024
apply_cors(app)
jobs.ensure_started()


def _err(code, message, status, **extra):
    return jsonify(error=code, message=message, **extra), status


def _authorized(jid):
    """Returns (payload, error_response). jid=None for POST /v1/jobs (id comes from the ticket)."""
    header = request.headers.get("Authorization", "")
    ticket = header[7:] if header.startswith("Bearer ") else None
    payload, reason = tickets.verify(ticket)
    if payload is None:
        return None, _err("unauthorized", "This upload is not authorised or has expired. Please start again.", 401, reason=reason)
    if jid is not None and payload["jid"] != jid:
        return None, _err("unauthorized", "This ticket does not match this job.", 401, reason="wrong_job")
    return payload, None


def _job_or_404(jid):
    job = jobs.get(jid)
    return job, (None if job else _err("not_found", "Unknown or expired job.", 404))


@app.route("/health")
def health():
    return jsonify(status="ok"), 200


@app.route("/v1/jobs", methods=["POST"])
def create_job():
    payload, bad = _authorized(None)
    if bad:
        return bad
    body = request.get_json(silent=True) or {}
    op = body.get("op")
    if op != payload["op"] or op not in ffmpeg_ops.OPS:
        return _err("bad_request", "Unsupported operation.", 400)
    size = body.get("size")
    if not isinstance(size, int) or isinstance(size, bool):
        return _err("bad_request", "The file size is required.", 400)
    if size > payload["max"]:
        return _err("too_large", "This file is larger than the size this ticket allows.", 413)
    params = body.get("params") if isinstance(body.get("params"), dict) else {}
    job, problem = jobs.create(payload["jid"], op, params, size, None)
    if problem:
        code, msg = problem
        return _err(code, msg, {"too_large": 413, "busy": 503, "job_exists": 409}.get(code, 400))
    return jsonify(jobId=job.jid, chunkBytes=config.CHUNK_BYTES, totalChunks=job.total_chunks), 201


@app.route("/v1/jobs/<jid>", methods=["GET"])
def job_status(jid):
    _, bad = _authorized(jid)
    if bad:
        return bad
    job, missing = _job_or_404(jid)
    if missing:
        return missing
    return jsonify(
        status=job.status,
        receivedChunks=len(jobs.received(job)) if job.status == "uploading" else job.total_chunks,
        totalChunks=job.total_chunks,
        progress=round(job.progress, 1),
        queuePosition=jobs.queue_position(job) if job.status == "queued" else 0,
        error=job.error,
        errorCode=job.error_code,
        outputExt=job.out_ext,
        outputBytes=job.out_size,
    )


@app.route("/v1/jobs/<jid>/chunks/<int:n>", methods=["PUT"])
def put_chunk(jid, n):
    _, bad = _authorized(jid)
    if bad:
        return bad
    job, missing = _job_or_404(jid)
    if missing:
        return missing
    if job.status != "uploading":
        return _err("bad_state", "This job is no longer accepting data.", 409)
    expected = jobs.chunk_range(job, n)
    if expected is None:
        return _err("bad_request", "Unknown chunk number.", 400)
    sha = request.headers.get("X-Chunk-Sha256", "")
    if not jobs.store_chunk(job, n, request.stream, expected, sha):
        return _err("bad_chunk", f"Chunk {n} arrived incomplete or altered; please resend it.", 400)
    return jsonify(ok=True, chunk=n), 200


@app.route("/v1/jobs/<jid>/start", methods=["POST"])
def start_job(jid):
    _, bad = _authorized(jid)
    if bad:
        return bad
    job, missing = _job_or_404(jid)
    if missing:
        return missing
    ok, problem = jobs.start(job)
    if ok:
        return jsonify(status=job.status), 202
    code, msg = problem
    return _err(code, msg, {"busy": 503, "incomplete": 409, "not_media": 422, "too_long": 422, "bad_request": 400}.get(code, 400))


@app.route("/v1/jobs/<jid>/result", methods=["GET"])
def result(jid):
    _, bad = _authorized(jid)
    if bad:
        return bad
    job, missing = _job_or_404(jid)
    if missing:
        return missing
    if job.status != "done":
        return _err("not_ready", "The result is not ready.", 409)
    path = os.path.join(job.dir, "output.bin")
    size = os.path.getsize(path)

    def stream():
        complete = False
        try:
            with open(path, "rb") as f:
                while True:
                    block = f.read(1 << 20)
                    if not block:
                        complete = True
                        break
                    yield block
        finally:
            if complete:
                jobs.delete_output(job)  # one full download, then it is gone

    return Response(stream(), mimetype=job.out_mime, headers={"Content-Length": str(size), "Cache-Control": "no-store"})


@app.route("/v1/jobs/<jid>", methods=["DELETE"])
def delete_job(jid):
    _, bad = _authorized(jid)
    if bad:
        return bad
    job = jobs.get(jid)
    if job:
        jobs.cancel_and_delete(job)
    return jsonify(ok=True), 200


@app.errorhandler(HTTPException)
def handle_http_exception(exc):
    return jsonify(error=(exc.name or "error").lower().replace(" ", "_"), message=exc.description), exc.code or 500


@app.errorhandler(Exception)
def handle_unexpected(exc):
    log.exception("unhandled exception (file content never logged)")
    return jsonify(error="internal_error", message="An unexpected error occurred."), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ["PORT"]), threaded=True)
