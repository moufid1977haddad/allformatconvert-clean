"""IS-Net general-use inference + mandatory subject-selection filter.

Pre/post-processing matches the reference implementation of the model's
own project (DIS, xuebinqin/DIS) exactly: resize 1024x1024, normalize
mean=0.5 std=1.0, min-max the raw output, resize the mask back up.
No third-party wrapper (e.g. rembg) is used -- see the service README for
why, and see docs/audit/RAPPORT-detourage-serveur.md for the numbers this
was validated against (pixel-identical to a browser onnxruntime-web run).

The "largest connected component" filter is applied unconditionally to
every mask before compositing -- see docs/audit/RAPPORT-detourage-filtre-sujet.md
for the measurement that justifies it: it repairs the one real defect
found (a secondary object kept alongside the main subject) without
degrading any of the other tested cases.

Per-stage timing (docs/audit/RAPPORT-detourage-phase2.md, "ou passe le
temps"): every call to predict_mask() returns a timings dict alongside
the mask, {stage_name: seconds}, so main.py can log it per request
without ever logging image bytes or filenames. Two knobs are read from
the environment so the two remaining latency hypotheses (thread count,
where the connected-component filter runs) can be A/B tested on the real
Railway deployment by flipping an env var and redeploying -- no rebuild,
no code change:

- ORT_INTRA_OP_THREADS / ORT_INTER_OP_THREADS: passed straight to
  onnxruntime's SessionOptions when set to a positive integer. Left unset
  (the default), onnxruntime picks its own thread count from the number
  of CPUs it detects -- which, in a container, is the *host's* CPU count,
  not the fraction actually allocated to this container (see the module
  docstring in main.py for the measurement this was designed to test).
- FILTER_AT_MODEL_RES: "1" (default) runs keep_largest_connected_component
  on the raw 1024x1024 mask *before* it is resized up to the input
  image's resolution, instead of after. Connected-component labeling
  (scipy.ndimage.label) is O(pixels); on a multi-megapixel input this is
  the difference between labeling ~1M pixels and labeling the model's
  fixed 1,048,576 -- i.e. for any input larger than 1024x1024 (nearly
  all real photos), labeling at model resolution is strictly less work,
  never more. Set to "0" to reproduce the pre-phase-2 behavior (filter
  after upsampling) for direct comparison. Output equivalence was
  verified against docs/audit/detourage-serveur/resultats/ before this
  became the default -- see docs/audit/RAPPORT-detourage-phase2.md.
"""
from __future__ import annotations

import os
import time

import numpy as np
import onnxruntime as ort
from PIL import Image
from scipy import ndimage

MODEL_INPUT_SIZE = (1024, 1024)
NORMALIZE_MEAN = (0.5, 0.5, 0.5)
NORMALIZE_STD = (1.0, 1.0, 1.0)
BINARIZE_THRESHOLD = 127
_STRUCTURE_8CONN = np.ones((3, 3), dtype=int)


def _env_int(name: str) -> int | None:
    raw = os.environ.get(name)
    if not raw:
        return None
    try:
        value = int(raw)
    except ValueError:
        return None
    return value if value > 0 else None


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip() not in ("0", "false", "False", "")


def load_session(onnx_path: str) -> ort.InferenceSession:
    opts = ort.SessionOptions()
    intra = _env_int("ORT_INTRA_OP_THREADS")
    inter = _env_int("ORT_INTER_OP_THREADS")
    if intra is not None:
        opts.intra_op_num_threads = intra
    if inter is not None:
        opts.inter_op_num_threads = inter
    return ort.InferenceSession(onnx_path, sess_options=opts, providers=["CPUExecutionProvider"])


def _preprocess(img: Image.Image) -> np.ndarray:
    im = img.convert("RGB").resize(MODEL_INPUT_SIZE, Image.Resampling.LANCZOS)
    arr = np.asarray(im).astype(np.float64)
    arr = arr / max(arr.max(), 1e-6)
    out = np.zeros_like(arr)
    for c in range(3):
        out[:, :, c] = (arr[:, :, c] - NORMALIZE_MEAN[c]) / NORMALIZE_STD[c]
    out = out.transpose(2, 0, 1)
    return np.expand_dims(out, 0).astype(np.float32)


def _run_inference(session: ort.InferenceSession, inp: np.ndarray) -> Image.Image:
    """Runs IS-Net and returns the raw soft mask at MODEL_INPUT_SIZE, mode 'L'."""
    input_name = session.get_inputs()[0].name
    out = session.run(None, {input_name: inp})[0]
    pred = out[:, 0, :, :]
    mn, mx = pred.min(), pred.max()
    pred = (pred - mn) / (mx - mn)
    pred = np.squeeze(pred)
    return Image.fromarray((pred * 255).astype("uint8"), mode="L")


def keep_largest_connected_component(mask: Image.Image) -> Image.Image:
    """Mandatory subject-selection filter (see module docstring).

    Zeroes out every connected component of the binarized mask except the
    largest one, while preserving the original soft alpha values within
    the kept component. Resolution-agnostic: callers decide whether to
    run this at model resolution or at the input image's resolution.
    """
    arr = np.array(mask)
    binary = (arr >= BINARIZE_THRESHOLD).astype(np.uint8)
    labels, n = ndimage.label(binary, structure=_STRUCTURE_8CONN)
    if n <= 1:
        return mask
    areas = ndimage.sum(np.ones_like(labels), labels, index=range(1, n + 1))
    largest_label = int(np.argmax(areas)) + 1
    out = np.zeros_like(arr)
    keep = labels == largest_label
    out[keep] = arr[keep]
    return Image.fromarray(out, mode="L")


def predict_mask(session: ort.InferenceSession, img: Image.Image) -> tuple[Image.Image, dict[str, float]]:
    """Runs the full mask pipeline, returning (mask, timings_seconds)."""
    timings: dict[str, float] = {}
    filter_at_model_res = _env_bool("FILTER_AT_MODEL_RES", default=True)

    t0 = time.perf_counter()
    inp = _preprocess(img)
    t1 = time.perf_counter()
    timings["preprocess"] = t1 - t0

    raw_mask = _run_inference(session, inp)
    t2 = time.perf_counter()
    timings["inference"] = t2 - t1

    if filter_at_model_res:
        filtered = keep_largest_connected_component(raw_mask)
        t3 = time.perf_counter()
        timings["connected_component_filter"] = t3 - t2

        mask = filtered.resize(img.size, Image.Resampling.LANCZOS)
        t4 = time.perf_counter()
        timings["mask_upsample"] = t4 - t3
    else:
        upsampled = raw_mask.resize(img.size, Image.Resampling.LANCZOS)
        t3 = time.perf_counter()
        timings["mask_upsample"] = t3 - t2

        mask = keep_largest_connected_component(upsampled)
        t4 = time.perf_counter()
        timings["connected_component_filter"] = t4 - t3

    return mask, timings


def cutout(img: Image.Image, mask: Image.Image) -> Image.Image:
    img_rgba = img.convert("RGBA")
    empty = Image.new("RGBA", img.size, (0, 0, 0, 0))
    return Image.composite(img_rgba, empty, mask)
