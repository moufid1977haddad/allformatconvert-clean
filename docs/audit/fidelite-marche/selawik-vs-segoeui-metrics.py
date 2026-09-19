from fontTools.ttLib import TTFont
import sys
def load(p):
    f=TTFont(p); return f['cmap'].getBestCmap(), f['hmtx'], f['head'].unitsPerEm
def w(font,ch):
    cm,hm,u=font
    g=cm.get(ord(ch)); return hm[g][0]/u if g else None
text_chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?()-'\"éèêàâçùûôîïëüœ«»€%&"
title="Titre superposé (police absente : Segoe UI)"
sample="Zone de texte chevauchante, pour vérifier l'ordre d'empilement (z-order). Rapport trimestriel — accents é è à ç « guillemets » 0123456789"
for label,seg,sel in [("regular","C:/Windows/Fonts/segoeui.ttf","rel/selawk.ttf"),("bold","C:/Windows/Fonts/segoeuib.ttf","rel/selawkb.ttf")]:
    A=load(seg);B=load(sel)
    diffs=[];miss=[]
    for c in text_chars:
        a,b=w(A,c),w(B,c)
        if a is None or b is None: miss.append(c);continue
        diffs.append((abs(a-b)/a,c,a,b))
    diffs.sort(reverse=True)
    def tot(f,s): return sum(w(f,c) or 0 for c in s)
    print(label,"glyphs compared",len(diffs),"missing",miss)
    print("  mean |dw|/w = %.2f%%  max = %.2f%% (%r)"%(100*sum(d[0] for d in diffs)/len(diffs),100*diffs[0][0],diffs[0][1]))
    print("  identical advances: %d/%d"%(sum(1 for d in diffs if d[0]<0.005),len(diffs)))
    for s,n in [(title,"title"),(sample,"sample")]:
        print("  %s total width ratio Selawik/Segoe = %.4f"%(n,tot(B,s)/tot(A,s)))
