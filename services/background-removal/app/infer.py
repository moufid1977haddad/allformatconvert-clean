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
"""
from __future__ import annotations

import numpy as np
import onnxruntime as ort
from PIL import Image
from scipy import ndimage

MODEL_INPUT_SIZE = (1024, 1024)
NORMALIZE_MEAN = (0.5, 0.5, 0.5)
NORMALIZE_STD = (1.0, 1.0, 1.0)
BINARIZE_THRESHOLD = 127
_STRUCTURE_8CONN = np.ones((3, 3), dtype=int)


def load_session(onnx_path: str) -> ort.InferenceSession:
    opts = ort.SessionOptions()
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


def predict_raw_mask(session: ort.InferenceSession, img: Image.Image) -> Image.Image:
    """Runs IS-Net and returns the raw (unfiltered) soft mask, mode 'L'."""
    inp = _preprocess(img)
    input_name = session.get_inputs()[0].name
    out = session.run(None, {input_name: inp})[0]
    pred = out[:, 0, :, :]
    mn, mx = pred.min(), pred.max()
    pred = (pred - mn) / (mx - mn)
    pred = np.squeeze(pred)
    mask = Image.fromarray((pred * 255).astype("uint8"), mode="L")
    return mask.resize(img.size, Image.Resampling.LANCZOS)


def keep_largest_connected_component(mask: Image.Image) -> Image.Image:
    """Mandatory subject-selection filter (see module docstring).

    Zeroes out every connected component of the binarized mask except the
    largest one, while preserving the original soft alpha values within
    the kept component.
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


def predict_mask(session: ort.InferenceSession, img: Image.Image) -> Image.Image:
    raw = predict_raw_mask(session, img)
    return keep_largest_connected_component(raw)


def cutout(img: Image.Image, mask: Image.Image) -> Image.Image:
    img_rgba = img.convert("RGBA")
    empty = Image.new("RGBA", img.size, (0, 0, 0, 0))
    return Image.composite(img_rgba, empty, mask)
