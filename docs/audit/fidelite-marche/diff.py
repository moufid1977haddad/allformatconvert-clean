import sys,glob
from PIL import Image, ImageChops
fid,comp=sys.argv[1],sys.argv[2]
a=sorted(glob.glob(f'ours/{fid}-[0-9]*.png')); b=sorted(glob.glob(f'{comp}/{fid}-[0-9]*.png'))
for i,(x,y) in enumerate(zip(a,b)):
    A=Image.open(x).convert('L');B=Image.open(y).convert('L')
    if A.size!=B.size: print(i+1,'size differs',A.size,B.size);continue
    d=ImageChops.difference(A,B).point(lambda v:255 if v>60 else 0)
    print(i+1,'differing px:',sum(1 for v in d.getdata() if v), 'of',A.size[0]*A.size[1])
