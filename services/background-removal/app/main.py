"""Minimal background-removal HTTP service (IS-Net general-use).

Design choices driven directly by the service's non-negotiable
requirements (see services/background-removal/README.md for the full
justification of each):

- The uploaded image is read from the raw POST body (`request.get_data()`),
  never from a multipart/form field. This means no filename ever exists
  anywhere in the request in the first place, which is the simplest way
  to guarantee one is never logged: there is nothing to log.
- The image is decoded and processed entirely from in-memory bytes
  (io.BytesIO in, io.BytesIO out via Pillow) and the result is streamed
  back with Flask's send_file -- at no point is it written to disk.
- The model is loaded lazily, on first call to /remove-background, behind
  a lock. /health never touches it, so it answers even before the model
  has ever been loaded (or while it is loading in another thread).
- Every error path returns a small, safe JSON body. Flask's default debug
  traceback is never reached: HTTPException (404, 413, ...) is translated
  to JSON using only its own safe name/description, and any other
  exception is logged internally (exception type + message, never image
  bytes) and answered with a generic message -- never a raw stack trace.
"""
from __future__ import annotations

import io
import logging
import os
import threading
import time

from flask import Flask, jsonify, request, send_file
from PIL import Image, UnidentifiedImageError
from werkzeug.exceptions import HTTPException

from . import infer

MODEL_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "models", "isnet-general-use.onnx")
)
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("background-removal")
log.info(
    "startup: os.cpu_count()=%s ORT_INTRA_OP_THREADS=%s ORT_INTER_OP_THREADS=%s FILTER_AT_MODEL_RES=%s",
    os.cpu_count(),
    os.environ.get("ORT_INTRA_OP_THREADS", "(unset)"),
    os.environ.get("ORT_INTER_OP_THREADS", "(unset)"),
    os.environ.get("FILTER_AT_MODEL_RES", "(unset, defaults to on)"),
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

_session = None
_session_lock = threading.Lock()


def get_session():
    """Lazily loads the ONNX session on first use.

    Deliberately not loaded at import/startup time: /health must respond
    without loading the model, and this is the way that is actually true
    under gunicorn rather than merely true because loading happens to be
    fast.
    """
    global _session
    if _session is None:
        with _session_lock:
            if _session is None:
                log.info("loading model")
                _session = infer.load_session(MODEL_PATH)
                log.info("model loaded")
    return _session


@app.route("/health")
def health():
    return jsonify(status="ok"), 200


@app.route("/remove-background", methods=["POST"])
def remove_background():
    request_start = time.perf_counter()
    data = request.get_data()
    if not data:
        return jsonify(error="empty_request", message="No image data was received."), 400

    t0 = time.perf_counter()
    try:
        img = Image.open(io.BytesIO(data))
        img.load()  # force full decode now, inside this try block
    except (UnidentifiedImageError, OSError, ValueError):
        return (
            jsonify(error="invalid_image", message="The uploaded data could not be decoded as an image."),
            400,
        )
    decode_seconds = time.perf_counter() - t0

    try:
        session = get_session()
        mask, mask_timings = infer.predict_mask(session, img)

        t1 = time.perf_counter()
        result = infer.cutout(img, mask)
        cutout_seconds = time.perf_counter() - t1
    except Exception:
        log.exception("inference failed (image content not logged)")
        return jsonify(error="internal_error", message="Background removal failed."), 500

    t2 = time.perf_counter()
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    encode_seconds = time.perf_counter() - t2

    total_seconds = time.perf_counter() - request_start
    log.info(
        "timing_breakdown_seconds size=%dx%d decode=%.3f preprocess=%.3f inference=%.3f "
        "connected_component_filter=%.3f mask_upsample=%.3f cutout=%.3f encode=%.3f total=%.3f",
        img.width,
        img.height,
        decode_seconds,
        mask_timings.get("preprocess", 0.0),
        mask_timings.get("inference", 0.0),
        mask_timings.get("connected_component_filter", 0.0),
        mask_timings.get("mask_upsample", 0.0),
        cutout_seconds,
        encode_seconds,
        total_seconds,
    )
    return send_file(buf, mimetype="image/png")


@app.errorhandler(HTTPException)
def handle_http_exception(exc: HTTPException):
    return (
        jsonify(error=(exc.name or "error").lower().replace(" ", "_"), message=exc.description),
        exc.code or 500,
    )


@app.errorhandler(Exception)
def handle_unexpected(exc: Exception):
    log.exception("unhandled exception (image content not logged)")
    return jsonify(error="internal_error", message="An unexpected error occurred."), 500


if __name__ == "__main__":
    port = int(os.environ["PORT"])  # no silent fallback: Railway always injects this
    app.run(host="0.0.0.0", port=port, threaded=False)
