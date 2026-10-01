"""Background Remover bench with a ground truth (P21, 02/10).

Real photos already cut out by hand (Wikimedia Commons, free licences, see SOURCES.md) are put on difficult
backgrounds -- a blue-violet plastic like the owner's iPhone test, a saturated green, two real photos -- so the true
alpha and the true colours of the subject are known exactly. Each composite then goes through OUR pipeline: the
browser's 1024 px JPEG upload copy, then the service's own IS-Net code (services/background-removal/app/infer.py,
imported, not copied: the model file and the largest-component filter are the production ones). No paid call.

Writes, per case, into docs/audit/detourage-p21/cases/<case>/: composite.jpg (the visitor's photo), gt.png (true
RGBA), mask.png (what the service would return). The browser part (bench.mjs) applies the page's post-processing.
Usage: python scripts/p21/bg-bench/make-cases.py
"""
import io
import json
import os
import sys
import urllib.request
import zlib

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'services', 'background-removal'))
from app.infer import load_session, predict_mask  # noqa: E402

OUT = os.path.join(ROOT, 'docs', 'audit', 'detourage-p21')
CACHE = os.path.join(OUT, 'sources')
SUBJECTS = {
    'beer-mug': 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Beer_mug_transparent.png',
    'cup': 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Tasse_de_chocolat.png',
    'teacup': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Teacup.png',
    'china-cup': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/2025.03.27_Royal_Albert_Sweet_Violets_Coffee_Cup_Soucer_Bone_China_04.png',
    'helmet': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Bicycle_Helmet_0085_Transparent.png',
    'cat-fur': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkish_Van_cat_transparent.png',
    'cat-short': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Fawn_Abyssinian_cat_no_background.png',
}


def fetch(name, url):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name + '.png')
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={'User-Agent': 'OCT-detourage-bench/1.0'})
        with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
            f.write(r.read())
    return Image.open(path).convert('RGBA')


def violet_plastic(w, h, seed):
    """Blue-violet glossy plastic: a gradient, a soft highlight, a little grain (the owner's photo)."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (x / w * 0.6 + y / h * 0.4)[..., None]
    a, b = np.array([92, 78, 205], np.float32), np.array([60, 52, 150], np.float32)
    img = a * (1 - t) + b * t
    hl = np.exp(-(((x - w * 0.3) / (w * 0.25)) ** 2 + ((y - h * 0.25) / (h * 0.2)) ** 2))[..., None]
    img = img + hl * np.array([90, 90, 60], np.float32)
    img = img + rng.normal(0, 3, img.shape)
    return np.clip(img, 0, 255)


def green(w, h, seed):
    rng = np.random.default_rng(seed)
    img = np.zeros((h, w, 3), np.float32) + np.array([40, 170, 60], np.float32)
    return np.clip(img + rng.normal(0, 3, img.shape), 0, 255)


def photo(path):
    def make(w, h, seed):
        im = Image.open(os.path.join(ROOT, path)).convert('RGB')
        s = max(w / im.width, h / im.height)
        im = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.Resampling.LANCZOS)
        return np.asarray(im.crop((0, 0, w, h))).astype(np.float32)
    return make


BACKGROUNDS = {
    'violet': violet_plastic,
    'green': green,
    'leaf': photo('docs/audit/detourage-comparaison/photos-test/05_faible_contraste.jpg'),
    'field': photo('docs/audit/detourage-comparaison/photos-test/03_objet_bords_complexes.jpg'),
}


def upload_copy(rgb):
    """The page's upload copy: longest side 1024 at most, JPEG 0.92 (resizeForUpload)."""
    im = Image.fromarray(rgb.astype(np.uint8))
    k = min(1, 1024 / max(im.size))
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=92)
    return Image.open(io.BytesIO(buf.getvalue())).convert('RGB')


BG_ONLY = '--bg-only' in sys.argv


def main():
    session = None if BG_ONLY else load_session(os.path.join(ROOT, 'services', 'background-removal', 'models', 'isnet-general-use.onnx'))
    index = []
    for sname, url in SUBJECTS.items():
        subj = fetch(sname, url)
        # Subjects under 1600 px are enlarged (Lanczos) so every case has photo-like dimensions; the alpha is the
        # same picture at the same scale, so the truth stays exact for the composite.
        k = max(1, 1600 / max(subj.size))
        k = min(k, 2000 / max(subj.size))  # large sources brought to photo-bench size
        if k != 1:
            subj = subj.resize((round(subj.width * k), round(subj.height * k)), Image.Resampling.LANCZOS)
        # A margin around the subject, as in a real photo.
        W, H = round(subj.width * 1.25), round(subj.height * 1.2)
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        canvas.paste(subj, ((W - subj.width) // 2, (H - subj.height) // 2))
        rgba = np.asarray(canvas).astype(np.float32)
        F, A = rgba[..., :3], rgba[..., 3:4] / 255
        for bname, make in BACKGROUNDS.items():
            case = f'{sname}__{bname}'
            d = os.path.join(OUT, 'cases', case)
            os.makedirs(d, exist_ok=True)
            B = make(W, H, zlib.crc32(case.encode()) % 1000)
            comp = F * A + B * (1 - A)
            Image.fromarray(np.clip(B + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(d, 'background.png'))
            if BG_ONLY:
                continue
            Image.fromarray(np.clip(comp + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(d, 'composite.jpg'), quality=95)
            canvas.save(os.path.join(d, 'gt.png'))
            up = upload_copy(comp)
            mask, _ = predict_mask(session, up)
            mask.save(os.path.join(d, 'mask.png'))
            index.append({'case': case, 'subject': sname, 'background': bname, 'width': W, 'height': H})
            print(case, W, H, flush=True)
    if BG_ONLY:
        return
    with open(os.path.join(OUT, 'cases', 'index.json'), 'w') as f:
        json.dump(index, f, indent=1)


if __name__ == '__main__':
    main()
