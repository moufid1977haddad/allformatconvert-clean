"""P28: damaged copies of the P27 text corpus (scripts/p27/pdfa-corpus: Greek, Arabic, Chinese, ligatures, decomposed
accents with /ActualText, subset fonts) for the PDF Repair text check. Every damage is deterministic.
    python scripts/p28/repair/make_damaged.py <out-dir>
"""
import os
import re
import sys

here = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(here, '..', '..', 'p27', 'pdfa-corpus')
out = sys.argv[1]
os.makedirs(out, exist_ok=True)


def damages(b):
    n = len(b)
    yield 'trunc90', b[: int(n * 0.9)]
    yield 'trunc60', b[: int(n * 0.6)]
    # no startxref / trailer: everything after the last "endstream"/"endobj" is cut
    last = max(b.rfind(b'endobj'), b.rfind(b'endstream'))
    yield 'notrailer', b[: last + 6]
    # every offset of a classic xref table off by 7 bytes, startxref wrong too
    x = re.sub(rb'(\d{10}) (\d{5}) n', lambda m: b'%010d %s n' % (int(m.group(1)) + 7, m.group(2)), b)
    x = re.sub(rb'startxref\s+(\d+)', lambda m: b'startxref\n%d' % (int(m.group(1)) + 13), x)
    yield 'badxref', x
    # 2 KB of zeros in the middle of the file
    mid = n // 2
    yield 'zeroblock', b[:mid] + b'\0' * min(2048, n - mid) + b[mid + 2048:]
    # every /Length of a stream wrong
    yield 'badlength', re.sub(rb'/Length (\d+)', lambda m: b'/Length %d' % (int(m.group(1)) + 11), b)
    # "endobj" keywords removed
    yield 'noendobj', b.replace(b'endobj', b'      ')
    # junk before the header
    yield 'junkhead', b'\x89JUNK' * 200 + b


names = sorted(f for f in os.listdir(src_dir) if f.endswith('.pdf'))
count = 0
for f in names:
    b = open(os.path.join(src_dir, f), 'rb').read()
    for kind, data in damages(b):
        if data == b:
            continue  # this damage does not apply to this file (e.g. no classic xref table)
        open(os.path.join(out, f'{f[:-4]}__{kind}.pdf'), 'wb').write(data)
        count += 1
print(f'{count} damaged files from {len(names)} sources in {out}')
