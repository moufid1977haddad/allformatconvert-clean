"""BiRefNet (MIT) masks for the same cases, to cost a model change of the Railway service (P21, 02/10).
Pre/post-processing as in rembg's birefnet session: 1024x1024, ImageNet mean/std, sigmoid of the first output.
Same upload copy as the page (1024 px JPEG 0.92). Writes mask_<name>.png next to mask.png. Local only, no paid call.
Usage: python scripts/p21/bg-bench/birefnet-masks.py <model.onnx> <name>
"""
import io, json, os, sys, time
import numpy as np, onnxruntime as ort
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
D = os.path.join(ROOT, 'docs', 'audit', 'detourage-p21', 'cases')
model, name = sys.argv[1], sys.argv[2]
s = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
inp = s.get_inputs()[0].name
times = []
ONLY = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
for c in json.load(open(os.path.join(D, 'index.json'))):
    if ONLY and c['case'] not in ONLY:
        continue
    d = os.path.join(D, c['case'])
    im = Image.open(os.path.join(d, 'composite.jpg')).convert('RGB')
    k = min(1, 1024 / max(im.size))
    im = im.resize((round(im.width * k), round(im.height * k)), Image.Resampling.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=92); im = Image.open(io.BytesIO(b.getvalue())).convert('RGB')
    x = np.asarray(im.resize((1024, 1024), Image.Resampling.LANCZOS)).astype(np.float32) / 255
    x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    t = time.perf_counter()
    out = s.run(None, {inp: x})[0][0, 0]
    times.append(time.perf_counter() - t)
    m = 1 / (1 + np.exp(-out))
    Image.fromarray((m * 255).astype(np.uint8), 'L').resize(im.size, Image.Resampling.LANCZOS).save(os.path.join(d, f'mask_{name}.png'))
    print(c['case'], f'{times[-1]:.1f}s', flush=True)
print('median inference s', sorted(times)[len(times) // 2], 'cpus', os.cpu_count())
