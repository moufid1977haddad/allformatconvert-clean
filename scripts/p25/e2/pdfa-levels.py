"""P25 (03/10, E2): which PDF/A levels can our open-source chain reach, VALIDATED by veraPDF?

For each source PDF (scripts/p25/e2/make-pdfs.mjs: the same page tagged and untagged by Chromium):
  A. Ghostscript exactly as services/pdf-tools does today (-dPDFA=N + PDFA_def.ps + sRGB) -> veraPDF b / u / a;
  B. pikepdf only, structure KEPT (no Ghostscript): OutputIntent sRGB + XMP pdfaid (part, conformance) + MarkInfo;
  C. A, then the XMP conformance rewritten to U (Ghostscript writes ToUnicode maps where it can).
Run: python scripts/p25/e2/pdfa-levels.py <dir with tagged.pdf, untagged.pdf> <verapdf.bat> <gswin64c>
"""
import json
import os
import shutil
import subprocess
import sys

import pikepdf

SRC_DIR, VERA, GS = sys.argv[1], sys.argv[2], sys.argv[3]
ASSETS = os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "pdf-tools", "assets")
ICC = os.path.join(ASSETS, "srgb.icc")


def vera(path, flavour):
    p = subprocess.run(["cmd", "/c", VERA, "-f", flavour, "--format", "json", path], capture_output=True, text=True)
    try:
        j = json.loads(p.stdout)
        jobs = j["report"]["jobs"][0]
        v = jobs["validationResult"][0] if isinstance(jobs["validationResult"], list) else jobs["validationResult"]
        failed = [r["clause"] + " " + r.get("specification", "")[-4:] for r in v["details"].get("ruleSummaries", []) if r.get("ruleStatus") == "FAILED"]
        return v["compliant"], failed[:4]
    except Exception as e:  # noqa: BLE001
        return False, [f"unreadable report: {e}", p.stdout[-200:], p.stderr[-200:]]


def ghostscript(src, out, part):
    work = os.path.dirname(out)
    shutil.copy(ICC, os.path.join(work, "srgb.icc"))
    args = [GS, f"-dPDFA={part}", "-dBATCH", "-dNOPAUSE", "-dNOOUTERSAVE", "--permit-file-read=srgb.icc", "-sColorConversionStrategy=RGB",
            "-sProcessColorModel=DeviceRGB", "-sDEVICE=pdfwrite", "-dPDFACompatibilityPolicy=1", f"-sOutputFile={os.path.basename(out)}",
            os.path.abspath(os.path.join(ASSETS, "PDFA_def.ps")), os.path.abspath(src)]
    p = subprocess.run(args, cwd=work, capture_output=True, text=True)
    return p.returncode == 0 and os.path.exists(out)


def set_pdfa_id(path, out, part, conformance):
    with pikepdf.open(path) as pdf:
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            meta["pdfaid:part"] = str(part)
            meta["pdfaid:conformance"] = conformance
        pdf.save(out)


def fixup(src, out, part, conformance):
    """Structure kept: what a pikepdf post-processor on the existing service could do without Ghostscript."""
    with pikepdf.open(src) as pdf:
        icc = pikepdf.Stream(pdf, open(ICC, "rb").read())
        icc["/N"] = 3
        pdf.Root.OutputIntents = pikepdf.Array([pikepdf.Dictionary(Type=pikepdf.Name.OutputIntent, S=pikepdf.Name.GTS_PDFA1,
                                                                    OutputConditionIdentifier=pikepdf.String("sRGB IEC61966-2.1"), DestOutputProfile=icc)])
        if conformance == "A":
            pdf.Root.MarkInfo = pikepdf.Dictionary(Marked=True)
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            meta.load_from_docinfo(pdf.docinfo)
            meta["pdfaid:part"] = str(part)
            meta["pdfaid:conformance"] = conformance
        pdf.save(out, min_version="1.7" if part > 1 else "1.4", force_version="1.4" if part == 1 else None,
                 object_stream_mode=pikepdf.ObjectStreamMode.disable if part == 1 else pikepdf.ObjectStreamMode.preserve)


rows = []
work = os.path.join(SRC_DIR, "out"); os.makedirs(work, exist_ok=True)
for name in ("tagged", "untagged"):
    src = os.path.join(SRC_DIR, f"{name}.pdf")
    with pikepdf.open(src) as pdf:
        tags = "/StructTreeRoot" in pdf.Root
    for part in (1, 2, 3):
        gs_out = os.path.join(work, f"{name}-gs{part}.pdf")
        if ghostscript(src, gs_out, part):
            with pikepdf.open(gs_out) as g:
                gs_tags = "/StructTreeRoot" in g.Root
            ok_b, why_b = vera(gs_out, f"{part}b")
            rows.append((name, tags, f"A Ghostscript -> {part}b", ok_b, why_b, f"structure kept: {gs_tags}"))
            if part > 1:
                u_out = os.path.join(work, f"{name}-gs{part}u.pdf")
                set_pdfa_id(gs_out, u_out, part, "U")
                ok, why = vera(u_out, f"{part}u")
                rows.append((name, tags, f"C Ghostscript + XMP U -> {part}u", ok, why, ""))
            a_out = os.path.join(work, f"{name}-gs{part}a.pdf")
            set_pdfa_id(gs_out, a_out, part, "A")
            ok, why = vera(a_out, f"{part}a")
            rows.append((name, tags, f"A' Ghostscript + XMP A -> {part}a", ok, why, ""))
        for conf in (("A", "U", "B") if part > 1 else ("A", "B")):
            out = os.path.join(work, f"{name}-fix{part}{conf}.pdf")
            try:
                fixup(src, out, part, conf)
                ok, why = vera(out, f"{part}{conf.lower()}")
            except Exception as e:  # noqa: BLE001
                ok, why = False, [f"fixup failed: {e}"]
            rows.append((name, tags, f"B pikepdf, structure kept -> {part}{conf.lower()}", ok, why, ""))

for r in rows:
    print(f"{r[0]:9} tagged={str(r[1]):5} {r[2]:38} {'PASS' if r[3] else 'fail'}  {r[5]}  {'' if r[3] else '; '.join(r[4])}")
