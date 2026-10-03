import zlib
def stream(s,extra=b''): return b'<< /Length %d %s>>\nstream\n'%(len(s),extra)+s+b'\nendstream'
font=b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
def content(t): return stream(b'BT /F1 24 Tf 72 700 Td (%s) Tj ET'%t)
page5_old=b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 4 0 R >>'
# objstm 10 holding obj 5 (old)
hdr=b'5 0 '; body=hdr+page5_old
ostm=zlib.compress(body)
out=b'%PDF-1.5\n'
out+=b'3 0 obj\n'+font+b'\nendobj\n'
out+=b'4 0 obj\n'+content(b'OLD version of page')+b'\nendobj\n'
out+=b'10 0 obj\n<< /Type /ObjStm /N 1 /First %d /Filter /FlateDecode /Length %d >>\nstream\n'%(len(hdr),len(ostm))+ostm+b'\nendstream\nendobj\n'
# incremental update: new content 11, page 5 rewritten as plain object
out+=b'11 0 obj\n'+content(b'NEW signed version')+b'\nendobj\n'
out+=b'5 0 obj\n'+page5_old.replace(b'/Contents 4 0 R',b'/Contents 11 0 R')+b'\nendobj\n'
open('D_objstm_then_plain.pdf','wb').write(out)
