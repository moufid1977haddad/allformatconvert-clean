import sys
def build(objs, order_root, trailer_extra=b''):
    # objs: dict num->bytes body; write in given sequence
    out=b'%PDF-1.4\n'
    offs={}
    for n,b in objs:
        offs[n]=len(out); out+=b'%d 0 obj\n'%n+b+b'\nendobj\n'
    return out
def stream(s): return b'<< /Length %d >>\nstream\n'%len(s)+s+b'\nendstream'
font=b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
def content(t): return stream(b'BT /F1 24 Tf 72 700 Td (%s) Tj ET'%t)
# Case A: inherited Resources + MediaBox, catalog/pages at end, truncated before them
objsA=[(3,font),(4,content(b'Hello inherited one')),(5,b'<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>'),
       (6,content(b'Second page text')),(7,b'<< /Type /Page /Parent 2 0 R /Contents 6 0 R >>')]
a=build(objsA,None)
open('A_inherit_trunc.pdf','wb').write(a)
# Case B: page order != object order (page1=obj 7, page2=obj 5), own resources
objsB=[(3,font),(4,content(b'I am page TWO')),(5,b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 4 0 R >>'),
       (6,content(b'I am page ONE')),(7,b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 6 0 R >>')]
open('B_order_trunc.pdf','wb').write(build(objsB,None))
# Case C: a deleted page via incremental update: original has 2 pages, then update rewrites Pages to 1 kid; truncated last part
objsC=objsB+[(8,content(b'DELETED page secret')),(9,b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 8 0 R >>')]
open('C_deleted_trunc.pdf','wb').write(build(objsC,None))
