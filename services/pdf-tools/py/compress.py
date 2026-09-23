"""PDF compression by in-place optimization.

Usage: python3 compress.py <in.pdf> <out.pdf> <level>
level: low | recommended | extreme
Prints one JSON line on stdout: {"ok": true, "images": n, "reencoded": m, ...}

Why this method and not Ghostscript (docs/audit/RAPPORT-ecarts-marche.md §3a):
measured on the audit's arXiv paper, a Ghostscript pdfwrite rewrite (any
preset, even none) DROPS a vector figure with transparency on page 15 and
re-renders every text page slightly differently. iLovePDF's output keeps text
pages pixel-identical and only touches images, which is what this does:
the page content streams are never rewritten; images are downsampled from
their real on-page display size and re-encoded as JPEG (kept only when
smaller); every stream is recompressed at the maximum Flate level and objects
are packed into object streams (qpdf, through pikepdf).
"""
import io
import json
import shutil
import sys

import pikepdf
from pikepdf import Name, Operator
from PIL import Image

# target DPI (from the real display size) and JPEG quality, per level.
# Calibrated against iLovePDF on the audit files -- see the report.
LEVELS = {
    'low': None,  # lossless: structure and stream recompression only
    # iLovePDF's own means, read from its output files: 150 dpi from the display
    # size for 'recommended', 72 dpi for 'extreme', standard IJG tables at ~q65.
    'recommended': {'dpi': 150, 'quality': 65},
    'extreme': {'dpi': 72, 'quality': 65},
}
MIN_PIXELS = 64 * 64  # icons and tiny images: never worth touching


def mat_mul(a, b):
    """3x3 affine matrices as 6-tuples (a b c d e f), result = a x b (PDF order)."""
    return (
        a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
        a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
        a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
    )


def display_size(ctm):
    """Width/height in points of the unit square under ctm (images are drawn in it)."""
    import math
    return math.hypot(ctm[0], ctm[1]), math.hypot(ctm[2], ctm[3])


def walk(content_owner, resources, ctm, sizes, depth=0):
    """Record the largest display size (points) of each image object."""
    if depth > 12 or resources is None:
        return
    xobjects = resources.get('/XObject', {})
    stack = []
    try:
        ops = pikepdf.parse_content_stream(content_owner)
    except Exception:
        return
    for operands, op in ops:
        if op == Operator('q'):
            stack.append(ctm)
        elif op == Operator('Q'):
            if stack:
                ctm = stack.pop()
        elif op == Operator('cm') and len(operands) == 6:
            ctm = mat_mul(tuple(float(x) for x in operands), ctm)
        elif op == Operator('Do') and operands:
            xo = xobjects.get(operands[0]) if hasattr(xobjects, 'get') else None
            if xo is None:
                continue
            sub = xo.get('/Subtype')
            if sub == Name.Image:
                w, h = display_size(ctm)
                key = xo.objgen
                pw, ph = sizes.get(key, (0.0, 0.0))
                sizes[key] = (max(pw, w), max(ph, h))
            elif sub == Name.Form:
                m = tuple(float(x) for x in xo.get('/Matrix', [1, 0, 0, 1, 0, 0]))
                walk(xo, xo.get('/Resources', resources), mat_mul(m, ctm), sizes, depth + 1)


def reencode(img_obj, disp_pts, cfg):
    """Returns True if the image was replaced by a smaller JPEG."""
    if img_obj.get('/ImageMask', False) or img_obj.get('/BitsPerComponent', 8) != 8:
        return False
    if '/Mask' in img_obj and not isinstance(img_obj.Mask, pikepdf.Stream):
        return False  # colour-key masks depend on exact pixel values; JPEG would break them
    w, h = int(img_obj.Width), int(img_obj.Height)
    if w * h < MIN_PIXELS:
        return False
    try:
        pil = pikepdf.PdfImage(img_obj).as_pil_image()
    except Exception:
        return False
    smask = img_obj.get('/SMask')
    if pil.mode in ('RGBA', 'LA') and isinstance(smask, pikepdf.Stream):
        pil = pil.convert(pil.mode[:-1])  # the alpha lives in the soft mask, handled below
    if pil.mode not in ('RGB', 'L'):
        return False  # CMYK, Lab, indexed with odd palettes: left untouched
    old_len = len(img_obj.read_raw_bytes())
    tw, th = w, h
    if disp_pts and disp_pts[0] > 0 and disp_pts[1] > 0:
        # downsample only if more than 1.3x above the target, like Acrobat/Ghostscript thresholds
        want_w = disp_pts[0] / 72.0 * cfg['dpi']
        want_h = disp_pts[1] / 72.0 * cfg['dpi']
        scale = max(want_w / w, want_h / h)
        if scale < 1 / 1.3:
            tw, th = max(1, round(w * scale)), max(1, round(h * scale))
    if (tw, th) != (w, h):
        pil = pil.resize((tw, th), Image.LANCZOS)
    buf = io.BytesIO()
    pil.save(buf, 'JPEG', quality=cfg['quality'], optimize=True, progressive=False, subsampling=2 if cfg['quality'] < 90 else 0)
    data = buf.getvalue()
    if len(data) >= old_len * 0.95 and (tw, th) == (w, h):
        return False
    if (tw, th) != (w, h) and isinstance(smask, pikepdf.Stream):
        # keep the soft mask the same size as its image, losslessly (Flate)
        try:
            m = pikepdf.PdfImage(smask).as_pil_image().convert('L').resize((tw, th), Image.LANCZOS)
            smask.write(m.tobytes(), filter=None)
            smask.Width, smask.Height = tw, th
            smask.ColorSpace, smask.BitsPerComponent = Name.DeviceGray, 8
            for k in ('/DecodeParms', '/Decode'):
                if k in smask:
                    del smask[k]
        except Exception:
            pass  # a mask of a different size than its image is valid PDF
    img_obj.write(data, filter=Name.DCTDecode)
    img_obj.Width, img_obj.Height = tw, th
    img_obj.ColorSpace = Name.DeviceRGB if pil.mode == 'RGB' else Name.DeviceGray
    img_obj.BitsPerComponent = 8
    for k in ('/DecodeParms', '/Decode', '/Intent'):
        if k in img_obj:
            del img_obj[k]
    return True


def _pfb(clear, binary, trailer):
    """Type 1 font program from a PDF /FontFile stream, as a PFB file."""
    if not trailer.strip():
        trailer = b'0' * 64 * 8 + b'\ncleartomark\n'
    out = b''
    for kind, seg in ((1, clear), (2, binary), (1, trailer)):
        out += bytes([0x80, kind]) + len(seg).to_bytes(4, 'little') + seg
    return out + b'\x80\x03'


def _same_outlines(pfb_path, cff_bytes):
    """Every glyph of the CFF draws the same outline bounds as the Type 1 original."""
    from fontTools.t1Lib import T1Font
    from fontTools.cffLib import CFFFontSet
    from fontTools.pens.boundsPen import BoundsPen
    t1 = T1Font(pfb_path, kind='PFB')
    t1gs = t1.getGlyphSet()
    cs = CFFFontSet()
    cs.decompile(io.BytesIO(cff_bytes), None)
    cffgs = cs[cs.fontNames[0]].CharStrings
    if set(t1gs.keys()) - {'.notdef'} != set(cffgs.keys()) - {'.notdef'}:
        return False
    for name in t1gs.keys():
        if name == '.notdef':
            continue
        a, b = BoundsPen(t1gs), BoundsPen(None)
        t1gs[name].draw(a)
        cffgs[name].draw(b)
        if (a.bounds is None) != (b.bounds is None):
            return False
        if a.bounds and max(abs(x - y) for x, y in zip(a.bounds, b.bounds)) > 0.5:
            return False
    return True


def type1_to_cff(pdf, tx, stats):
    """Type 1 fonts -> CFF (FontFile3/Type1C) with Adobe's tx, hints kept.

    This is what iLovePDF does (232 KB of Type 1 became 47 KB of Type1C on the
    audit's arXiv paper, text pages pixel-identical). A font is converted only
    if every glyph outline is proven identical; otherwise it is left alone.
    """
    import os
    import subprocess
    import tempfile
    done = {}
    for fd in [o for o in pdf.objects if isinstance(o, pikepdf.Dictionary) and o.get('/Type') == Name.FontDescriptor]:
        ff = fd.get('/FontFile')
        if not isinstance(ff, pikepdf.Stream):
            continue
        key = ff.objgen
        if key not in done:
            done[key] = None
            try:
                data = ff.read_bytes()
                l1, l2 = int(ff.Length1), int(ff.Length2)
                with tempfile.TemporaryDirectory() as d:
                    src, dst = os.path.join(d, 'f.pfb'), os.path.join(d, 'f.cff')
                    with open(src, 'wb') as fh:
                        fh.write(_pfb(data[:l1], data[l1:l1 + l2], data[l1 + l2:]))
                    subprocess.run([tx, '-cff', '+E', '+S', src, dst], check=True, capture_output=True, timeout=60)
                    with open(dst, 'rb') as fh:
                        cff = fh.read()
                    if len(cff) < len(ff.read_raw_bytes()) and _same_outlines(src, cff):
                        new = pikepdf.Stream(pdf, cff)
                        new.Subtype = Name.Type1C
                        done[key] = new
                    else:
                        stats['fonts_kept'] = stats.get('fonts_kept', 0) + 1
            except Exception:
                stats['fonts_kept'] = stats.get('fonts_kept', 0) + 1
        if done[key] is not None:
            del fd['/FontFile']
            fd.FontFile3 = done[key]
    stats['fonts_converted'] = sum(1 for v in done.values() if v is not None)


def merge_truetype_subsets(pdf, stats):
    """One font program for several subsets of the same TrueType font.

    Office/LaTeX figures often embed the same font once per figure (on the
    audit's arXiv paper: Arial and Arial Bold, 5 subsets each, iLovePDF kept 2
    fonts out of 10). Subsets are merged only when every table except the
    glyph data is byte-identical (same cmap, widths, hinting programs), and
    only by union: a glyph present in two subsets must be byte-identical too.
    """
    import collections
    import hashlib
    from fontTools.ttLib import TTFont
    groups = collections.defaultdict(list)
    for fd in [o for o in pdf.objects if isinstance(o, pikepdf.Dictionary) and o.get('/Type') == Name.FontDescriptor]:
        ff = fd.get('/FontFile2')
        if not isinstance(ff, pikepdf.Stream):
            continue
        try:
            font = TTFont(io.BytesIO(ff.read_bytes()))
            tags = sorted(t for t in font.reader.keys() if t not in ('glyf', 'loca', 'head', 'name'))
            sig = hashlib.sha256(b''.join(t.encode() + font.reader[t] for t in tags)).hexdigest()
        except Exception:
            continue
        groups[(str(fd.get('/FontName', '')).split('+')[-1], sig)].append((fd, ff, font))
    merged = 0
    for members in groups.values():
        if len({m[1].objgen for m in members}) < 2:
            continue
        try:
            base = TTFont(io.BytesIO(members[0][1].read_bytes()))
            bglyf = base['glyf']
            ok = True
            for _, ff, font in members[1:]:
                oglyf = font['glyf']
                for name in font.getGlyphOrder():
                    raw_theirs = oglyf[name].compile(oglyf) if oglyf[name].numberOfContours != 0 else b''
                    raw_ours = bglyf[name].compile(bglyf) if bglyf[name].numberOfContours != 0 else b''
                    if raw_theirs and raw_ours and raw_theirs != raw_ours:
                        ok = False
                        break
                    if raw_theirs and not raw_ours:
                        bglyf[name] = oglyf[name]
                if not ok:
                    break
            if not ok:
                continue
            out = io.BytesIO()
            base.save(out)
            data = out.getvalue()
            new = pikepdf.Stream(pdf, data)
            new.Length1 = len(data)
            for fd, _, _ in members:
                fd.FontFile2 = new
            merged += len(members) - 1
        except Exception:
            continue
    stats['truetype_merged'] = merged


def main():
    src, dst, level = sys.argv[1], sys.argv[2], sys.argv[3]
    if level not in LEVELS:
        raise SystemExit('unknown level')
    cfg = LEVELS[level]
    stats = {'images': 0, 'reencoded': 0}
    pikepdf.settings.set_flate_compression_level(9)
    with pikepdf.open(src) as pdf:
        if cfg:
            sizes = {}
            for page in pdf.pages:
                walk(page.obj, page.obj.get('/Resources'), (1, 0, 0, 1, 0, 0), sizes)
            images = [o for o in pdf.objects if isinstance(o, pikepdf.Stream) and o.get('/Subtype') == Name.Image]
            # soft masks are alpha channels, not pictures: left lossless
            masks = {o.SMask.objgen for o in images if isinstance(o.get('/SMask'), pikepdf.Stream)}
            for xo in images:
                if xo.objgen in masks:
                    continue
                stats['images'] += 1
                # an image never found on a page (unused, or behind an
                # unparsed pattern) is re-encoded at its own size, never downsampled
                if reencode(xo, sizes.get(xo.objgen), cfg):
                    stats['reencoded'] += 1
        merge_truetype_subsets(pdf, stats)
        tx = shutil.which('tx')
        if tx:
            type1_to_cff(pdf, tx, stats)
        else:
            stats['fonts_converted'] = None  # tx missing: never silently claimed
        pdf.remove_unreferenced_resources()
        pdf.save(
            dst,
            compress_streams=True,
            recompress_flate=True,
            stream_decode_level=pikepdf.StreamDecodeLevel.generalized,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
            linearize=False,
        )
    stats['ok'] = True
    print(json.dumps(stats))


if __name__ == '__main__':
    main()
