"""PDF/A levels U and A (P26, E2) -- helpers called by src/pdfa.js. Every output is validated by veraPDF there;
nothing here claims a level on its own.

  inspect <in>                    -> prints {"tagged": bool, "marked": bool, "encrypted": bool}
  set-id <in> <out> <part> <conf> -> copy of <in> whose XMP says PDF/A-<part><conf> (used after Ghostscript,
                                     which writes the ToUnicode maps but always labels its output B)
  keep <in> <out> <part> <conf>   -> the source itself, STRUCTURE KEPT (Ghostscript drops the structure tree, so it
                                     cannot make an A level): sRGB OutputIntent (unless a PDF/A one exists), XMP
                                     from the document info + pdfaid, MarkInfo /Marked true for A, annotation flags
                                     (hidden ones removed). Page content is not touched.
                                     P27: also B (parts 1-3) -- Ghostscript's rewrite can change the text (ligatures,
                                     accents, Greek), the source kept as it is cannot. Part 1 is written as PDF 1.4
                                     without object streams (PDF/A-1 is based on PDF 1.4).

Why this and not a tagging engine: an A level needs a tagged PDF (structure tree). No open-source tool tags an
untagged PDF reliably (the auto-taggers are commercial: Adobe, Apryse, callas, PDFix), so A is offered only for PDFs
that are already tagged -- exports from Word, LibreOffice, Google Docs, Chrome -- measured in P25 (scripts/p25/e2).
"""
import io
import json
import os
import sys

import pikepdf
from fontTools.ttLib import TTFont

ICC = os.path.join(os.path.dirname(__file__), "..", "assets", "srgb.icc")


def inspect(src):
    try:
        with pikepdf.open(src) as pdf:
            root = pdf.Root
            mark = root.get("/MarkInfo")
            marked = bool(mark is not None and isinstance(mark, pikepdf.Dictionary) and bool(mark.get("/Marked", False)))
            tagged = "/StructTreeRoot" in root and isinstance(root.StructTreeRoot, pikepdf.Dictionary)
            return {"ok": True, "tagged": bool(tagged), "marked": marked, "encrypted": pdf.is_encrypted}
    except pikepdf.PasswordError:
        return {"ok": False, "encrypted": True, "tagged": False, "marked": False}


def set_id(src, out, part, conf):
    with pikepdf.open(src) as pdf:
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            meta["pdfaid:part"] = str(part)
            meta["pdfaid:conformance"] = conf
        pdf.save(out)


def add_cidsets(pdf):
    """PDF/A-1 (6.3.5) requires a CIDSet in the descriptor of every embedded CIDFont subset; Chromium does not
    write one (measured on Chrome's "Save as PDF", P27). Built from the embedded TrueType program itself: one bit per
    glyph of the program (CID = GID with an Identity CIDToGIDMap, else through the map, GID 0 excluded) -- veraPDF's
    own definition of "present" (its PDF/A-2 rule 6.2.11.4.2 checks a CIDSet against it; measured: marking only the
    glyphs that have an outline fails it). Every CIDFont of the file is covered (pages, form XObjects, annotation
    appearances). Fonts whose program cannot be read are left as they are -- veraPDF then refuses the file."""
    for obj in pdf.objects:
        if not isinstance(obj, pikepdf.Dictionary) or obj.get("/Subtype") != pikepdf.Name.CIDFontType2:
            continue
        desc = obj.get("/FontDescriptor")
        if desc is None or "/CIDSet" in desc or "/FontFile2" not in desc:
            continue
        try:
            glyphs = len(TTFont(io.BytesIO(desc.FontFile2.read_bytes())).getGlyphOrder())
        except Exception:
            continue
        cmap = obj.get("/CIDToGIDMap")
        if cmap is None or cmap == pikepdf.Name.Identity:
            cids = list(range(glyphs))
        else:
            raw = cmap.read_bytes()
            cids = [c for c in range(len(raw) // 2) if 0 < int.from_bytes(raw[2 * c:2 * c + 2], "big") < glyphs]
            cids = [0] + cids
        if not cids:
            continue
        bits = bytearray((max(cids) // 8) + 1)
        for c in cids:
            bits[c // 8] |= 0x80 >> (c % 8)
        desc.CIDSet = pikepdf.Stream(pdf, bytes(bits))


class NotKeepable(Exception):
    """The source cannot be kept as it is: making it PDF/A here would change what it shows."""


def has_pdfa_intent(pdf):
    for oi in pdf.Root.get("/OutputIntents", []):
        if oi.get("/S") == pikepdf.Name.GTS_PDFA1 and "/DestOutputProfile" in oi:
            return True
    return False


def keep(src, out, part, conf):
    with pikepdf.open(src) as pdf:
        # An existing PDF/A output intent (a print profile such as FOGRA) is kept: replacing it would make a CMYK
        # file fail and send it to Ghostscript's colour conversion for nothing. Otherwise sRGB.
        if not has_pdfa_intent(pdf):
            icc = pikepdf.Stream(pdf, open(ICC, "rb").read())
            icc["/N"] = 3
            pdf.Root.OutputIntents = pikepdf.Array([pikepdf.Dictionary(
                Type=pikepdf.Name.OutputIntent, S=pikepdf.Name.GTS_PDFA1,
                OutputConditionIdentifier=pikepdf.String("sRGB IEC61966-2.1"), DestOutputProfile=icc)])
        if conf == "A":
            pdf.Root.MarkInfo = pikepdf.Dictionary(Marked=True)
        # PDF/A 6.3.2: every annotation but Popup carries /F with Print set and Hidden, Invisible, NoView,
        # ToggleNoView cleared (LibreOffice writes its links without /F). P27 (independent review): clearing those
        # flags would SHOW what the source hides -- a hidden stamp "CONFIDENTIAL DRAFT" became visible text. So: a
        # Hidden annotation (never displayed nor printed) is removed, which changes nothing that can be seen or
        # printed; a NoView one (printed only, e.g. a print watermark) cannot be kept either way -> not keepable,
        # Ghostscript's path (text-checked) decides.
        for page in pdf.pages:
            annots = page.get("/Annots")
            if annots is None:
                continue
            kept = []
            for annot in annots:
                if annot.get("/Subtype") == pikepdf.Name.Popup:
                    kept.append(annot)
                    continue
                flags = int(annot.get("/F", 0))
                if flags & 2:
                    continue
                if flags & 32:
                    raise NotKeepable("print-only annotation")
                annot.F = (flags | 4) & ~(1 | 256)
                kept.append(annot)
            page.Annots = pikepdf.Array(kept)
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            meta.load_from_docinfo(pdf.docinfo)
            meta["pdfaid:part"] = str(part)
            meta["pdfaid:conformance"] = conf
        if part == 1:
            # PDF/A-1 is based on PDF 1.4: written as 1.4 without object streams. Features of later versions are not
            # removed here -- veraPDF's 1b profile refuses them, and Ghostscript's path takes over.
            add_cidsets(pdf)
            pdf.save(out, force_version="1.4", object_stream_mode=pikepdf.ObjectStreamMode.disable)
        else:
            pdf.save(out, min_version="1.7")


def main():
    cmd = sys.argv[1]
    if cmd == "inspect":
        print(json.dumps(inspect(sys.argv[2])))
        return
    src, out, part, conf = sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5].upper()
    if cmd == "keep" and conf == "B":
        if part not in (1, 2, 3):
            raise SystemExit("bad level")
    elif part not in (2, 3) or conf not in ("A", "U"):
        raise SystemExit("bad level")
    try:
        (set_id if cmd == "set-id" else keep)(src, out, part, conf)
    except NotKeepable as e:
        print(json.dumps({"ok": False, "reason": str(e)}))
        return
    print(json.dumps({"ok": True}))


if __name__ == "__main__":
    main()
