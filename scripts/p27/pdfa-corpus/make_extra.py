"""P27 phase 1 (independent review): three edge cases for the PDF/A text check, built from p27-pdflib-subset.pdf.
  p27-hidden-stamp.pdf  -- a Stamp annotation flagged Hidden whose appearance reads "CONFIDENTIAL DRAFT": a kept
                           PDF/A must not show it (it was un-hidden before the review).
  p27-print-only.pdf    -- the same stamp flagged NoView + Print (a print-only watermark).
  p27-owner-locked.pdf  -- owner password only, text extraction not allowed: its text must still be checked.
    python scripts/p27/pdfa-corpus/make_extra.py
"""
import os

import pikepdf

here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "p27-pdflib-subset.pdf")


def stamp(pdf, flags):
    page = pdf.pages[0]
    font = pdf.make_indirect(pikepdf.Dictionary(Type=pikepdf.Name.Font, Subtype=pikepdf.Name.Type1, BaseFont=pikepdf.Name.Helvetica))
    ap = pikepdf.Stream(pdf, b"BT /Hv 28 Tf 10 20 Td (CONFIDENTIAL DRAFT) Tj ET")
    ap.Type = pikepdf.Name.XObject
    ap.Subtype = pikepdf.Name.Form
    ap.BBox = [0, 0, 400, 60]
    ap.Resources = pikepdf.Dictionary(Font=pikepdf.Dictionary(Hv=font))
    annot = pdf.make_indirect(pikepdf.Dictionary(Type=pikepdf.Name.Annot, Subtype=pikepdf.Name.Stamp, Rect=[100, 300, 500, 360],
                                                 F=flags, AP=pikepdf.Dictionary(N=ap)))
    page.Annots = pdf.make_indirect(pikepdf.Array([annot]))


for name, flags in (("p27-hidden-stamp.pdf", 2), ("p27-print-only.pdf", 32 | 4)):
    with pikepdf.open(src) as pdf:
        stamp(pdf, flags)
        pdf.save(os.path.join(here, name))

with pikepdf.open(src) as pdf:
    pdf.save(os.path.join(here, "p27-owner-locked.pdf"), encryption=pikepdf.Encryption(
        owner="p27-owner", user="", R=6, allow=pikepdf.Permissions(extract=False, accessibility=False)))
print("ok")
