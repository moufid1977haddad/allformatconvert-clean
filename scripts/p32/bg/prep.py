"""P32 (04/10) — common inputs of the model bench, and the CURRENT model's masks (local, 0 $).

For each of the 28 P21/P31 bench cases (docs/audit/detourage-p21/cases, composite + true alpha) and the owner's photo
(docs/audit/p32-bg/private/IMG_2433.JPG):
  - upload.jpg : the page's upload copy (resizeForUpload: longest side 1024 at most, JPEG 0.92), the EXACT bytes every
                 model receives (IS-Net here, BRIA / BiRefNet on fal as a data URI);
  - mask_isnet.png : the production service's own code (services/background-removal/app/infer.py: IS-Net + the
                 largest-connected-component filter), on upload.jpg;
  - photo.png (owner's photo only): the photo upright (EXIF applied), as the browser draws it.
Work dir: docs/audit/p32-bg/private/work/<case>/ (git-ignored). Timings -> work/isnet-times.json.
Usage: python scripts/p32/bg/prep.py
"""
import io
import json
import os
import sys
import time

from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'services', 'background-removal'))
from app.infer import load_session, predict_mask  # noqa: E402

CASES = os.path.join(ROOT, 'docs', 'audit', 'detourage-p21', 'cases')
WORK = os.path.join(ROOT, 'docs', 'audit', 'p32-bg', 'private', 'work')


def upload_bytes(im):
    k = min(1, 1024 / max(im.size))
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.Resampling.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=92)
    return b.getvalue()


def main():
    sess = load_session(os.path.join(ROOT, 'services', 'background-removal', 'models', 'isnet-general-use.onnx'))
    index = json.load(open(os.path.join(CASES, 'index.json')))
    jobs = [(c['case'], os.path.join(CASES, c['case'], 'composite.jpg')) for c in index]
    jobs.append(('IMG_2433', os.path.join(ROOT, 'docs', 'audit', 'p32-bg', 'private', 'IMG_2433.JPG')))
    times = {}
    for case, src in jobs:
        d = os.path.join(WORK, case)
        os.makedirs(d, exist_ok=True)
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if case == 'IMG_2433':
            im.save(os.path.join(d, 'photo.png'))
        ub = upload_bytes(im)
        open(os.path.join(d, 'upload.jpg'), 'wb').write(ub)
        up = Image.open(io.BytesIO(ub)).convert('RGB')
        predict_mask(sess, up) if not times else None  # warm-up once (first run pays session init)
        t = time.perf_counter()
        mask, _ = predict_mask(sess, up)
        times[case] = round((time.perf_counter() - t) * 1000)
        mask.save(os.path.join(d, 'mask_isnet.png'))
        print(case, up.size, times[case], 'ms', flush=True)
    json.dump(times, open(os.path.join(WORK, 'isnet-times.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
