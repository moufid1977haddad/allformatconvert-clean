"""P31 (03/10) — masks of every LOCAL candidate model for one real photo (no paid call).

Same path as the page: EXIF orientation applied (the browser draws the photo upright), the 1024 px JPEG 0.92 upload
copy, then
  - isnet: the production service code (services/background-removal/app/infer.py, imported: model + largest-component
    filter);
  - birefnet-<name>: BiRefNet ONNX (MIT), pre/post-processing as scripts/p21/bg-bench/birefnet-masks.py.
Usage: python scripts/p31/bg/masks-photo.py <photo> <out_dir> [birefnet_name=path.onnx ...]
Writes <out_dir>/upright.png (the photo as the browser sees it) and <out_dir>/mask_<model>.png at the upload size.
"""
import io
import os
import sys
import time

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'services', 'background-removal'))
from app.infer import load_session, predict_mask  # noqa: E402


def upload_copy(im):
    k = min(1, 1024 / max(im.size))
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.Resampling.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=92)
    return Image.open(io.BytesIO(b.getvalue())).convert('RGB')


def birefnet(path, up):
    s = ort.InferenceSession(path, providers=['CPUExecutionProvider'])
    x = np.asarray(up.resize((1024, 1024), Image.Resampling.LANCZOS)).astype(np.float32) / 255
    x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    t = time.perf_counter()
    out = s.run(None, {s.get_inputs()[0].name: x})[0][0, 0]
    dt = time.perf_counter() - t
    m = 1 / (1 + np.exp(-out))
    return Image.fromarray((m * 255).astype(np.uint8), 'L').resize(up.size, Image.Resampling.LANCZOS), dt


def main():
    photo, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(photo)).convert('RGB')
    im.save(os.path.join(out, 'upright.png'))
    up = upload_copy(im)
    sess = load_session(os.path.join(ROOT, 'services', 'background-removal', 'models', 'isnet-general-use.onnx'))
    t = time.perf_counter()
    mask, _ = predict_mask(sess, up)
    print('isnet', f'{time.perf_counter() - t:.2f}s', flush=True)
    mask.save(os.path.join(out, 'mask_isnet.png'))
    for arg in sys.argv[3:]:
        name, path = arg.split('=', 1)
        m, dt = birefnet(path, up)
        m.save(os.path.join(out, f'mask_birefnet-{name}.png'))
        print('birefnet-' + name, f'{dt:.1f}s', flush=True)


if __name__ == '__main__':
    main()
