# P30: how far a converter's PDF is from Word's own PDF of the same document -- pages, words (pdftotext, as a bag of
# words: 100 % = the same words the same number of times) and, per page, the share of pixels that differ at 50 dpi
# (gray, threshold 64/255). Writes <out>/<name>.png: Word | candidate side by side, page by page, to look at.
#   python scripts/p30/vs-word.py <word-dir> <candidate-dir> <out-dir>
import os, re, subprocess, sys, tempfile, collections
from PIL import Image, ImageChops
import numpy as np

ref, cand, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
def pages(f):
    d = tempfile.mkdtemp()
    subprocess.run(['pdftoppm', '-r', '50', '-gray', '-png', f, os.path.join(d, 'p')], check=True)
    return [Image.open(os.path.join(d, n)).convert('L') for n in sorted(os.listdir(d))]
def words(f):
    t = subprocess.run(['pdftotext', '-enc', 'UTF-8', f, '-'], capture_output=True).stdout.decode('utf-8', 'replace')
    return collections.Counter(re.findall(r'\w+', t.lower()))
for n in sorted(os.listdir(ref)):
    a, b = os.path.join(ref, n), os.path.join(cand, n)
    if not os.path.exists(b):
        print(f'MISSING {n}'); continue
    pa, pb = pages(a), pages(b)
    wa, wb = words(a), words(b)
    common = sum((wa & wb).values()); total = max(sum(wa.values()), sum(wb.values()), 1)
    diffs = []
    for x, y in zip(pa, pb):
        y = y.resize(x.size)
        d = np.asarray(ImageChops.difference(x, y))
        diffs.append(round(100 * (d > 64).mean(), 2))
    print(f'{n}: pages word {len(pa)} / candidate {len(pb)} | words in common {100*common/total:.1f} % | pixels differing per page {diffs}')
    w = max(p.width for p in pa + pb); h = sum(max(x.height, (pb[i].height if i < len(pb) else 0)) for i, x in enumerate(pa))
    m = Image.new('L', (2 * w + 10, max(h, 1)), 255); yy = 0
    for i, x in enumerate(pa):
        m.paste(x, (0, yy))
        if i < len(pb): m.paste(pb[i], (w + 10, yy))
        yy += max(x.height, pb[i].height if i < len(pb) else 0)
    m.save(os.path.join(out, n.replace('.pdf', '.png')))
