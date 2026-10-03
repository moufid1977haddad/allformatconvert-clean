"""PDF/A levels U and A (P26, E2) -- helpers called by src/pdfa.js. Every output is validated by veraPDF there;
nothing here claims a level on its own.

  inspect <in>                    -> prints {"tagged": bool, "marked": bool, "encrypted": bool}
  set-id <in> <out> <part> <conf> -> copy of <in> whose XMP says PDF/A-<part><conf> (used after Ghostscript,
                                     which writes the ToUnicode maps but always labels its output B)
  keep <in> <out> <part> <conf>   -> the source itself, STRUCTURE KEPT (Ghostscript drops the structure tree, so it
                                     cannot make an A level): sRGB OutputIntent, XMP from the document info +
                                     pdfaid, MarkInfo /Marked true for A. Page content is not touched.

Why this and not a tagging engine: an A level needs a tagged PDF (structure tree). No open-source tool tags an
untagged PDF reliably (the auto-taggers are commercial: Adobe, Apryse, callas, PDFix), so A is offered only for PDFs
that are already tagged -- exports from Word, LibreOffice, Google Docs, Chrome -- measured in P25 (scripts/p25/e2).
"""
import json
import os
import sys

import pikepdf

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


def keep(src, out, part, conf):
    with pikepdf.open(src) as pdf:
        icc = pikepdf.Stream(pdf, open(ICC, "rb").read())
        icc["/N"] = 3
        pdf.Root.OutputIntents = pikepdf.Array([pikepdf.Dictionary(
            Type=pikepdf.Name.OutputIntent, S=pikepdf.Name.GTS_PDFA1,
            OutputConditionIdentifier=pikepdf.String("sRGB IEC61966-2.1"), DestOutputProfile=icc)])
        if conf == "A":
            pdf.Root.MarkInfo = pikepdf.Dictionary(Marked=True)
        # PDF/A 6.3.2: every annotation but Popup carries /F with Print set and Hidden, Invisible, NoView,
        # ToggleNoView cleared (LibreOffice writes its links without /F). Ghostscript does the same on its path.
        for page in pdf.pages:
            for annot in page.get("/Annots", []):
                if annot.get("/Subtype") == pikepdf.Name.Popup:
                    continue
                flags = int(annot.get("/F", 0))
                annot.F = (flags | 4) & ~(1 | 2 | 32 | 256)
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            meta.load_from_docinfo(pdf.docinfo)
            meta["pdfaid:part"] = str(part)
            meta["pdfaid:conformance"] = conf
        pdf.save(out, min_version="1.7")


def main():
    cmd = sys.argv[1]
    if cmd == "inspect":
        print(json.dumps(inspect(sys.argv[2])))
        return
    src, out, part, conf = sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5].upper()
    if part not in (2, 3) or conf not in ("A", "U"):
        raise SystemExit("bad level")
    (set_id if cmd == "set-id" else keep)(src, out, part, conf)
    print(json.dumps({"ok": True}))


if __name__ == "__main__":
    main()
