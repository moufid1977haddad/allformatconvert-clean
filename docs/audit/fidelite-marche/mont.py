import sys, glob, subprocess, os
from PIL import Image, ImageDraw
# usage: mont.py fid competitor
fid, comp = sys.argv[1], sys.argv[2]
def render(pdf, tag):
    subprocess.run(['pdftoppm','-r','70','-png',pdf,tag],stderr=subprocess.DEVNULL)
    return sorted(glob.glob(tag+'-*.png'))
a = render(f'ours/{fid}.pdf', f'ours/{fid}')
b = render(f'{comp}/{fid}.pdf', f'{comp}/{fid}')
n = max(len(a),len(b))
for i in range(n):
    ims=[Image.open(x[i]).convert('RGB') if i<len(x) else Image.new('RGB',(300,300),'white') for x in (a,b)]
    h=max(im.height for im in ims); w=sum(im.width for im in ims)+20
    c=Image.new('RGB',(w,h+18),'white'); d=ImageDraw.Draw(c)
    d.text((4,2),'OURS',fill='red'); d.text((ims[0].width+24,2),comp.upper(),fill='red')
    c.paste(ims[0],(0,18)); c.paste(ims[1],(ims[0].width+20,18))
    c.save(f'{comp}/{fid}-cmp{i+1}.png')
print(len(a),len(b))
