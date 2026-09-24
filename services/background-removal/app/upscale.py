"""AI image upscaling (x2 / x4) -- the model behind the site's Image Upscaler.

Model: 4xNomos2_hq_mosr (MoSR architecture, MIT) by Philip Hofmann, weights under
CC BY 4.0. The GitHub release text reads "CC-BY-0.4" (a licence that does not exist), but the
author's own structured declaration settles it: his Hugging Face repo Phips/4xNomos2_hq_mosr was
created with `license: cc-by-4.0` in its initial commit (2024-10-09), as are 110 of his 122 HF
repos, including every "CC-BY-0.4" release checked; OpenModelDB records CC-BY-4.0
(docs/audit/RAPPORT-licence-et-ameliorations.md §1). CC BY requires attribution: the tool page credits the model.
Chosen by measurement against iLoveIMG on the audit photo (docs/audit/RAPPORT-ecarts-marche.md §3c):
LPIPS 0.107 vs 0.164 (lower is better), same PSNR (32.92), visually closest to the original
of 9 open models tested; Real-ESRGAN x4plus 0.173, SwinIR-M 0.172.

The file never crosses the site's own functions: the visitor's browser uploads it to the
media-processing service (chunked "stage" job), the site's route hands us only the job id and
a server ticket, we read the image from media-processing and deposit the PNG back there. The
media service URL comes from OUR configuration (MEDIA_SERVICE_URL), never from the request.
"""
from __future__ import annotations

import hashlib
import io
import logging
import os
import re
import threading
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageOps

from . import infer

log = logging.getLogger("background-removal")

MODEL_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "models", "4xNomos2_hq_mosr_fp32.onnx"))
MEDIA_SERVICE_URL = os.environ.get("MEDIA_SERVICE_URL", "").rstrip("/")  # empty -> the endpoint answers 503
# Measured on Railway before this value was set -- see the report. Input pixels, before upscaling.
MAX_INPUT_PIXELS = int(os.environ.get("UPSCALE_MAX_INPUT_PIXELS") or 1_000_000)
MAX_SOURCE_BYTES = 30 * 1024 * 1024
TILE = 256      # input pixels per tile side: bounds memory whatever the image size
OVERLAP = 16    # context around each tile, cropped away after inference (no visible seams)
SCALE = 4
JID_RE = re.compile(r"^[0-9a-zA-Z]{16,64}$")

_session = None
_lock = threading.Lock()
# One upscale at a time: the model uses every core; two at once would each run at half speed and
# double the memory. The site's route waits for its turn (gunicorn has one worker, see Dockerfile).
_run_lock = threading.Lock()


container_cpus = infer.container_cpus  # kept importable from here (see infer.py)


def session():
    global _session
    if _session is None:
        with _lock:
            if _session is None:
                import onnxruntime as ort
                opts = ort.SessionOptions()
                threads = infer._env_int("UPSCALE_ORT_THREADS") or container_cpus()
                if threads:
                    opts.intra_op_num_threads = threads
                    opts.inter_op_num_threads = 1
                log.info("loading upscale model: intra_op_threads=%s (os.cpu_count()=%s, cgroup cpus=%s)", threads, os.cpu_count(), container_cpus())
                _session = ort.InferenceSession(MODEL_PATH, sess_options=opts, providers=["CPUExecutionProvider"])
    return _session


def _upscale_rgb(rgb: np.ndarray) -> np.ndarray:
    """uint8 HxWx3 -> uint8 (4H)x(4W)x3, tiled."""
    s = session()
    name = s.get_inputs()[0].name
    h, w, _ = rgb.shape
    out = np.zeros((h * SCALE, w * SCALE, 3), dtype=np.uint8)
    src = rgb.astype(np.float32) / 255.0
    for y0 in range(0, h, TILE):
        for x0 in range(0, w, TILE):
            y1, x1 = min(h, y0 + TILE), min(w, x0 + TILE)
            py0, px0 = max(0, y0 - OVERLAP), max(0, x0 - OVERLAP)
            py1, px1 = min(h, y1 + OVERLAP), min(w, x1 + OVERLAP)
            tile = src[py0:py1, px0:px1].transpose(2, 0, 1)[None]
            res = s.run(None, {name: np.ascontiguousarray(tile)})[0][0].transpose(1, 2, 0)
            oy, ox = (y0 - py0) * SCALE, (x0 - px0) * SCALE
            out[y0 * SCALE:y1 * SCALE, x0 * SCALE:x1 * SCALE] = (
                np.clip(res[oy:oy + (y1 - y0) * SCALE, ox:ox + (x1 - x0) * SCALE], 0, 1) * 255 + 0.5
            ).astype(np.uint8)
    return out


def upscale_image(img: Image.Image, scale: int) -> Image.Image:
    img = ImageOps.exif_transpose(img)  # phone photos: the orientation every viewer shows
    alpha = img.getchannel("A") if img.mode in ("RGBA", "LA", "PA") or (img.mode == "P" and "transparency" in img.info) else None
    rgb = np.asarray(img.convert("RGB"))
    with _run_lock:
        big = Image.fromarray(_upscale_rgb(rgb))
    if alpha is not None:
        big.putalpha(alpha.resize(big.size, Image.Resampling.LANCZOS))
    if scale == 2:
        big = big.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    return big


def _media(path: str, ticket: str, method: str = "GET", data: bytes | None = None, headers: dict | None = None, timeout: int = 120):
    h = {"Authorization": "Bearer " + ticket, **(headers or {})}
    r = urllib.request.Request(MEDIA_SERVICE_URL + path, data=data, method=method, headers=h)
    return urllib.request.urlopen(r, timeout=timeout)


def _keep_alive(jid: str, ticket: str, stop: threading.Event):
    # media-processing sleeps when idle and keeps its jobs in memory: one status request every 45 s keeps
    # it awake while we work (same measured failure as docs/audit/RAPPORT-plafonds-mesures.md).
    while not stop.wait(45):
        try:
            _media(f"/v1/jobs/{jid}", ticket, timeout=15).read()
        except Exception:
            pass


def staged(jid: str, ticket: str, scale: int):
    """Returns (status, json_dict)."""
    if not MEDIA_SERVICE_URL:
        log.error("MEDIA_SERVICE_URL is not set")
        return 503, {"ok": False, "error": "Upscaling is not available right now."}
    if not JID_RE.match(jid or "") or not isinstance(ticket, str) or len(ticket) > 2048 or scale not in (2, 4):
        return 400, {"ok": False, "error": "Invalid request."}
    stop = threading.Event()
    threading.Thread(target=_keep_alive, args=(jid, ticket, stop), daemon=True).start()
    t0 = time.perf_counter()
    try:
        try:
            with _media(f"/v1/jobs/{jid}/source", ticket) as r:
                data = r.read(MAX_SOURCE_BYTES + 1)
        except urllib.error.HTTPError as e:
            return (410 if e.code in (404, 409) else 502), {"ok": False, "error": "Your uploaded image is no longer available. Please upload it again."}
        if len(data) > MAX_SOURCE_BYTES:
            return 413, {"ok": False, "error": f"Images up to {MAX_SOURCE_BYTES // (1024 * 1024)} MB are accepted."}
        try:
            img = Image.open(io.BytesIO(data))
            if img.width * img.height > MAX_INPUT_PIXELS:
                return 413, {"ok": False, "error": f"This image is {img.width}x{img.height}. The AI upscaler accepts images up to {MAX_INPUT_PIXELS / 1e6:.1f} megapixels (for example 1000x1000)."}
            img.load()
        except (OSError, ValueError, Image.DecompressionBombError):
            return 400, {"ok": False, "error": "This file could not be read as an image."}
        t1 = time.perf_counter()
        out = upscale_image(img, scale)
        t2 = time.perf_counter()
        buf = io.BytesIO()
        out.save(buf, format="PNG", optimize=False, compress_level=6)
        png = buf.getvalue()
        try:
            with _media(f"/v1/jobs/{jid}/output", ticket, method="PUT", data=png, headers={
                "X-Output-Ext": "png", "X-Output-Sha256": hashlib.sha256(png).hexdigest(),
                "Content-Type": "application/octet-stream", "Content-Length": str(len(png)),
            }, timeout=300) as r:
                r.read()
        except urllib.error.HTTPError:
            return 502, {"ok": False, "error": "The result could not be stored for download. Please try again."}
        log.info("upscale x%d %dx%d -> %dx%d model=%.1fs total=%.1fs bytes=%d", scale, img.width, img.height,
                 out.width, out.height, t2 - t1, time.perf_counter() - t0, len(png))
        return 200, {"ok": True, "outputBytes": len(png), "width": out.width, "height": out.height, "seconds": round(t2 - t1, 1)}
    finally:
        stop.set()
