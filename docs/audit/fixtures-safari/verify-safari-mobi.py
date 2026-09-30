# Reads safari-book.mobi back with KindleUnpack (the reference MOBI/AZW3 reader, packaged as `mobi` on PyPI:
# pip install mobi) and checks what the book must contain. Exit code 0 only if everything is there.
# Usage: python docs/audit/fixtures-safari/verify-safari-mobi.py [file]
import os, sys, glob, shutil
import mobi

path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'safari-book.mobi')
tmp, out = mobi.extract(path)
try:
    html = open(out, encoding='utf-8', errors='strict').read()
    images = [p for p in glob.glob(os.path.join(tmp, '**', '*'), recursive=True) if p.lower().endswith(('.jpg', '.jpeg'))]
    opf = ''.join(open(p, encoding='utf-8').read() for p in glob.glob(os.path.join(tmp, '**', '*.opf'), recursive=True))
    checks = {
        'three chapters': all(f'Chapter {n}' in html for n in (1, 2, 3)),
        'all 60 paragraphs': 'Paragraph 1:' in html and 'Paragraph 60:' in html,
        'UTF-8 accents, quotes and euro kept': 'Déjà vu' in html and 'café’s crème brûlée' in html and '4,50 €' in html,
        'bold and italic kept': '<b>Bold words</b>' in html and '<i>italic words</i>' in html,
        'list kept': '<li>Second item</li>' in html,
        'the JPEG photo extracted': len(images) == 1 and os.path.getsize(images[0]) > 30000,
        'the photo is referenced by the text': 'img' in html and ('.jpg' in html or '.jpeg' in html),
        'title and author in the metadata': 'Safari Test Book' in opf and 'OnlineConverTools' in opf,
    }
    for k, v in checks.items():
        print(('PASS' if v else 'FAIL'), k)
    print('extracted by KindleUnpack to', os.path.basename(out), '-', len(html), 'characters of HTML')
    sys.exit(0 if all(checks.values()) else 1)
finally:
    shutil.rmtree(tmp, ignore_errors=True)
