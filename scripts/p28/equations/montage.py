"""P28: side-by-side first pages of one document as rendered by several converters (Word = the reference).
  python scripts/p28/equations/montage.py <out.png> <name> <label>=<pdf> [<label>=<pdf> ...]
A missing PDF is drawn as an empty column with its label, never skipped silently."""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

out, name, cols = sys.argv[1], sys.argv[2], [a.split('=', 1) for a in sys.argv[3:]]
tiles = []
for label, pdf in cols:
    img = None
    if os.path.exists(pdf):
        d = tempfile.mkdtemp()
        subprocess.run(['pdftoppm', '-r', '55', '-f', '1', '-l', '1', '-png', pdf, os.path.join(d, 'p')], check=True)
        img = Image.open(os.path.join(d, sorted(os.listdir(d))[0])).convert('RGB')
    tiles.append((label + ('' if img else ' (no PDF)'), img))
w = max((t[1].width for t in tiles if t[1]), default=470)
h = max((t[1].height for t in tiles if t[1]), default=600)
sheet = Image.new('RGB', (len(tiles) * (w + 10), h + 40), 'white')
dr = ImageDraw.Draw(sheet)
dr.text((4, 2), name, fill='black')
for i, (label, img) in enumerate(tiles):
    x = i * (w + 10)
    dr.text((x + 4, 18), label, fill='blue')
    if img:
        sheet.paste(img, (x, 36))
    dr.rectangle([x, 36, x + w - 1, 36 + h - 1], outline='gray')
sheet.save(out)
print(out)
