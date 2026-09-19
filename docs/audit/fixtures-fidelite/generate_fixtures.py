"""Generates the six deterministic Office fixtures used by
docs/audit/RAPPORT-fidelite-office.md to measure Office -> PDF conversion
fidelity through the production pipeline.

Regenerate with:  python docs/audit/fixtures-fidelite/generate_fixtures.py

Each fixture concentrates known LibreOffice/Gotenberg conversion pitfalls
(font substitution, floating images, formula recalculation, missing
fonts, etc.) so that the measurement step in the audit has something
concrete to fail on if the pipeline is weak, and something concrete to
pass if it is not.
"""

import os
import zipfile
import re

from PIL import Image as PILImage, ImageDraw, ImageFont

import docx
from docx.shared import Pt, Inches, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn, nsdecls
from docx.oxml import OxmlElement, parse_xml

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import ColorScaleRule
from openpyxl.chart import BarChart, Reference
from openpyxl.utils import get_column_letter

from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPt, Emu as PEmu
from pptx.enum.text import PP_ALIGN
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE
from pptx.dml.color import RGBColor as PRGBColor

HERE = os.path.dirname(os.path.abspath(__file__))


# --------------------------------------------------------------------------
# Shared image assets (generated, not fetched -- fixtures must be
# deterministic and self-contained).
# --------------------------------------------------------------------------

def make_diagram_png(path):
    """A simple flow-diagram-like PNG for the anchored/wrapped image test."""
    img = PILImage.new("RGB", (600, 360), "white")
    d = ImageDraw.Draw(img)
    boxes = [(20, 20, 260, 140, (52, 120, 200), "Collecte"),
             (340, 20, 580, 140, (200, 90, 40), "Traitement"),
             (180, 200, 420, 340, (40, 160, 90), "Rapport")]
    for x0, y0, x1, y1, color, label in boxes:
        d.rectangle([x0, y0, x1, y1], fill=color, outline=(0, 0, 0), width=3)
        d.text(((x0 + x1) // 2 - len(label) * 4, (y0 + y1) // 2 - 8), label, fill="white")
    d.line([260, 80, 340, 80], fill=(0, 0, 0), width=4)
    d.line([300, 140, 300, 200], fill=(0, 0, 0), width=4)
    img.save(path, "PNG")


def make_watermark_png(path):
    """A rotated, translucent gray watermark image for the header."""
    W, H = 1000, 400
    layer = PILImage.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    try:
        font = ImageFont.truetype("arial.ttf", 90)
    except Exception:
        font = ImageFont.load_default()
    d.text((60, 130), "CONFIDENTIEL", fill=(160, 160, 160, 110), font=font)
    layer = layer.rotate(30, expand=True)
    layer.save(path, "PNG")


def make_fullbleed_png(path):
    """A full-slide photo-like PNG for the PPTX full-screen image test."""
    W, H = 1280, 720
    img = PILImage.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        for x in range(0, W, 4):
            r = int(20 + 200 * (x / W))
            g = int(30 + 150 * (y / H))
            b = int(180 - 120 * (x / W))
            for dx in range(4):
                if x + dx < W:
                    px[x + dx, y] = (r, g, b)
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 220, H // 2 - 220, W // 2 + 220, H // 2 + 220], fill=(255, 220, 60))
    img.save(path, "PNG")


# --------------------------------------------------------------------------
# python-docx low-level helpers (fields, floating images, borders, columns)
# --------------------------------------------------------------------------

def add_field(paragraph, field_code, cached_text="1"):
    """Insert a simple Word field (PAGE, TOC, ...) with a cached fallback."""
    run = paragraph.add_run()
    r = run._r
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field_code
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    t = OxmlElement("w:t")
    t.text = cached_text
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for el in (begin, instr, sep, t, end):
        r.append(el)
    return run


def add_floating_picture(paragraph, image_path, width_emu, height_emu,
                          offset_x_emu=0, offset_y_emu=0, doc_pr_id=100,
                          behind_doc=False, wrap="square"):
    """Add an anchored (floating) picture with text wrapping, since
    python-docx's add_picture() only supports inline images."""
    part = paragraph.part
    rId, _image = part.get_or_add_image(image_path)
    wrap_el = {
        "square": '<wp:wrapSquare wrapText="bothSides"/>',
        "none": '<wp:wrapNone/>',
    }.get(wrap, '<wp:wrapSquare wrapText="bothSides"/>')
    xml = f'''
    <w:drawing {nsdecls("w", "wp", "a", "pic", "r")}>
      <wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0"
                 relativeHeight="{251658240 + doc_pr_id}"
                 behindDoc="{1 if behind_doc else 0}" locked="0"
                 layoutInCell="1" allowOverlap="1">
        <wp:simplePos x="0" y="0"/>
        <wp:positionH relativeFrom="column"><wp:posOffset>{offset_x_emu}</wp:posOffset></wp:positionH>
        <wp:positionV relativeFrom="paragraph"><wp:posOffset>{offset_y_emu}</wp:posOffset></wp:positionV>
        <wp:extent cx="{width_emu}" cy="{height_emu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        {wrap_el}
        <wp:docPr id="{doc_pr_id}" name="Picture {doc_pr_id}"/>
        <wp:cNvGraphicFramePr>
          <a:graphicFrameLocks noChangeAspect="1"/>
        </wp:cNvGraphicFramePr>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="{doc_pr_id}" name="Picture {doc_pr_id}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{rId}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="{width_emu}" cy="{height_emu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:anchor>
    </w:drawing>
    '''
    drawing = parse_xml(xml)
    paragraph._p.append(drawing)


def set_cell_borders(cell, sz=8, color="000000"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tc_pr.append(borders)


def shade_cell(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)


def set_two_columns(section, num=2, space_twips=560):
    sect_pr = section._sectPr
    cols = sect_pr.find(qn("w:cols"))
    if cols is None:
        cols = OxmlElement("w:cols")
        sect_pr.append(cols)
    cols.set(qn("w:num"), str(num))
    cols.set(qn("w:space"), str(space_twips))


def add_footnotes(docx_path, footnotes):
    """Post-process a saved .docx to add real Word footnotes.

    python-docx has no footnote API, so this splices the required OOXML
    parts (footnotes.xml, content-type override, relationship, styles)
    directly into the zip after saving. `footnotes` is an ordered list of
    footnote body strings; the document must already contain, once per
    footnote in order, a lone run whose text is exactly "%%FN{n}%%"
    (1-indexed) marking where the reference belongs.
    """
    with zipfile.ZipFile(docx_path, "r") as zin:
        names = zin.namelist()
        data = {n: zin.read(n) for n in names}

    document_xml = data["word/document.xml"].decode("utf-8")
    for i, _ in enumerate(footnotes, start=1):
        marker = f"%%FN{i}%%"
        pattern = re.compile(r"<w:r>(?:(?!</w:r>).)*?" + re.escape(marker) + r"(?:(?!</w:r>).)*?</w:r>", re.DOTALL)
        replacement = (
            f'<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr>'
            f'<w:footnoteReference w:id="{i}"/></w:r>'
        )
        document_xml, n = pattern.subn(replacement, document_xml, count=1)
        if n != 1:
            raise RuntimeError(f"footnote marker {marker} not found exactly once (found {n})")
    data["word/document.xml"] = document_xml.encode("utf-8")

    styles_xml = data["word/styles.xml"].decode("utf-8")
    extra_styles = '''
    <w:style w:type="paragraph" w:styleId="FootnoteText">
      <w:name w:val="footnote text"/>
      <w:basedOn w:val="Normal"/>
      <w:link w:val="FootnoteTextChar"/>
      <w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
      <w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
    </w:style>
    <w:style w:type="character" w:customStyle="1" w:styleId="FootnoteTextChar">
      <w:name w:val="Footnote Text Char"/>
      <w:basedOn w:val="DefaultParagraphFont"/>
      <w:link w:val="FootnoteText"/>
      <w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
    </w:style>
    <w:style w:type="character" w:styleId="FootnoteReference">
      <w:name w:val="footnote reference"/>
      <w:basedOn w:val="DefaultParagraphFont"/>
      <w:rPr><w:vertAlign w:val="superscript"/></w:rPr>
    </w:style>
    '''
    styles_xml = styles_xml.replace("</w:styles>", extra_styles + "</w:styles>")
    data["word/styles.xml"] = styles_xml.encode("utf-8")

    fn_items = []
    fn_items.append(
        '<w:footnote w:type="separator" w:id="-1"><w:p><w:pPr>'
        '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
        '<w:r><w:separator/></w:r></w:p></w:footnote>'
    )
    fn_items.append(
        '<w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:pPr>'
        '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
        '<w:r><w:continuationSeparator/></w:r></w:p></w:footnote>'
    )
    for i, text in enumerate(footnotes, start=1):
        fn_items.append(
            f'<w:footnote w:id="{i}"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr>'
            f'<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r>'
            f'<w:r><w:t xml:space="preserve"> {text}</w:t></w:r></w:p></w:footnote>'
        )
    footnotes_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<w:footnotes {nsdecls("w")}>' + "".join(fn_items) + "</w:footnotes>"
    )
    data["word/footnotes.xml"] = footnotes_xml.encode("utf-8")
    names.append("word/footnotes.xml")

    ct_xml = data["[Content_Types].xml"].decode("utf-8")
    ct_xml = ct_xml.replace(
        "</Types>",
        '<Override PartName="/word/footnotes.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>'
        "</Types>",
    )
    data["[Content_Types].xml"] = ct_xml.encode("utf-8")

    rels_xml = data["word/_rels/document.xml.rels"].decode("utf-8")
    existing_ids = re.findall(r'Id="rId(\d+)"', rels_xml)
    next_id = max(int(x) for x in existing_ids) + 1 if existing_ids else 1
    rels_xml = rels_xml.replace(
        "</Relationships>",
        f'<Relationship Id="rId{next_id}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" '
        'Target="footnotes.xml"/></Relationships>',
    )
    data["word/_rels/document.xml.rels"] = rels_xml.encode("utf-8")

    with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for name in names:
            zout.writestr(name, data[name])


# --------------------------------------------------------------------------
# Fixture 1 -- fidelite-01.docx
# --------------------------------------------------------------------------

def build_fidelite_01(out_path, diagram_png):
    d = docx.Document()

    section = d.sections[0]
    header_p = section.header.paragraphs[0]
    header_p.text = "Audit de fidélité — Fixture 01 — Rapport trimestriel"
    header_p.style = d.styles["Header"]

    footer_p = section.footer.paragraphs[0]
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_p.add_run("Page ")
    add_field(footer_p, "PAGE", "1")
    footer_p.add_run(" sur ")
    add_field(footer_p, "NUMPAGES", "1")

    h = d.add_heading("Rapport trimestriel — Fixture 01", level=1)
    for run in h.runs:
        run.font.name = "Cambria"

    p = d.add_paragraph("Ce document teste les polices ")
    r = p.add_run("Calibri")
    r.font.name = "Calibri"
    r.bold = True
    p.add_run(" et ")
    r2 = p.add_run("Cambria")
    r2.font.name = "Cambria"
    r2.italic = True
    p.add_run(", les en-têtes/pieds de page numérotés, une liste à deux niveaux, "
               "un tableau fusionné, une image ancrée avec habillage, une section à deux "
               "colonnes, un saut de page et une table des matières générée.")
    for run in p.runs:
        if run.font.name is None:
            run.font.name = "Calibri"

    d.add_heading("1. Plan d'action", level=2)
    items = [
        ("Collecte des données", 0),
        ("Sources internes", 1),
        ("Sources externes", 1),
        ("Traitement", 0),
        ("Nettoyage", 1),
        ("Agrégation", 1),
        ("Publication du rapport", 0),
    ]
    for text, level in items:
        style = "List Number" if level == 0 else "List Number 2"
        d.add_paragraph(text, style=style)

    d.add_heading("2. Résultats du trimestre", level=2)
    table = d.add_table(rows=5, cols=4)
    table.style = "Table Grid"
    headers = ["Région", "T1", "T2", "Total"]
    for j, htext in enumerate(headers):
        cell = table.cell(0, j)
        cell.text = htext
        shade_cell(cell, "2F5496")
        for run in cell.paragraphs[0].runs:
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            run.bold = True
        set_cell_borders(cell)
    rows_data = [
        ["Nord", "120", "150", ""],
        ["Sud", "90", "110", ""],
        ["Est / Ouest (fusionné)", "", "", "205"],
        ["Total", "210", "260", "470"],
    ]
    for i, row in enumerate(rows_data, start=1):
        for j, val in enumerate(row):
            cell = table.cell(i, j)
            cell.text = val
            set_cell_borders(cell)
    merged = table.cell(3, 0).merge(table.cell(3, 1))
    merged.text = "Est / Ouest (fusionné)"
    set_cell_borders(merged)

    d.add_heading("3. Illustration", level=2)
    img_p = d.add_paragraph(
        "Le schéma suivant est ancré dans le texte avec habillage carré : le "
        "paragraphe doit continuer à s'écouler autour de l'image plutôt que de "
        "la traiter comme un objet en ligne isolé sur sa propre ligne. " * 4
    )
    add_floating_picture(
        img_p, diagram_png,
        width_emu=Emu(Inches(2.6)).emu, height_emu=Emu(Inches(1.56)).emu,
        offset_x_emu=Emu(Inches(3.2)).emu, offset_y_emu=Emu(Inches(0.05)).emu,
        doc_pr_id=101,
    )

    sec2 = d.add_section(WD_SECTION.CONTINUOUS)
    set_two_columns(sec2, num=2)
    d.add_heading("4. Section à deux colonnes", level=2)
    d.add_paragraph(
        "Ce paragraphe doit être composé sur deux colonnes journalistiques. "
        "Si le convertisseur aplatit la section en une seule colonne, c'est "
        "une dégradation de mise en page mesurable. " * 6
    )
    d.add_paragraph(
        "Deuxième paragraphe de la section à deux colonnes, pour vérifier que "
        "le texte s'enchaîne correctement d'une colonne à l'autre sans se "
        "chevaucher ni se répéter. " * 6
    )

    d.add_section(WD_SECTION.NEW_PAGE)
    d.add_heading("Table des matières", level=1)
    toc_p = d.add_paragraph()
    add_field(
        toc_p, 'TOC \\o "1-3" \\h \\z \\u',
        "Mettre à jour les champs pour afficher la table des matières.",
    )

    d.save(out_path)


# --------------------------------------------------------------------------
# Fixture 2 -- fidelite-02.docx
# --------------------------------------------------------------------------

def build_fidelite_02(out_path, watermark_png):
    d = docx.Document()

    section = d.sections[0]
    add_floating_picture(
        section.header.paragraphs[0], watermark_png,
        width_emu=Emu(Inches(5.5)).emu, height_emu=Emu(Inches(2.2)).emu,
        offset_x_emu=Emu(Inches(0.8)).emu, offset_y_emu=Emu(Inches(2.0)).emu,
        doc_pr_id=201, behind_doc=True, wrap="none",
    )

    h = d.add_heading("Fixture 02 — Filigrane, notes de bas de page et accents français", level=1)
    for run in h.runs:
        run.font.name = "Arial Narrow"

    body_text = (
        "Voici un paragraphe dense et justifié destiné à vérifier la fidélité "
        "typographique française : accents (à, â, é, è, ê, ë, î, ï, ô, ù, û, ü, "
        "ç), le tiret cadratin — utilisé ici — et les « guillemets français » "
        "avec espaces insécables, par opposition aux “guillemets anglais”. "
        "Le texte est composé en Arial Narrow, une police connue pour poser des "
        "problèmes de substitution lors de conversions Office vers PDF si "
        "l'équivalent métriquement compatible (Liberation Sans Narrow) n'est "
        "pas disponible côté serveur de conversion. "
    ) * 3

    p1 = d.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r1 = p1.add_run(body_text + " ")
    r1.font.name = "Arial Narrow"
    marker1 = p1.add_run("%%FN1%%")
    marker1.font.name = "Arial Narrow"

    p2 = d.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r2 = p2.add_run(
        "Un second paragraphe, tout aussi dense, permet de vérifier que la "
        "justification reste stable sur plusieurs paragraphes consécutifs et "
        "que la seconde note de bas de page se rapporte bien au bon "
        "emplacement dans le flux de texte. " * 3 + " "
    )
    r2.font.name = "Arial Narrow"
    marker2 = p2.add_run("%%FN2%%")
    marker2.font.name = "Arial Narrow"

    d.save(out_path)
    add_footnotes(out_path, [
        "Première note de bas de page : elle doit apparaître en bas de la page, pas en fin de document.",
        "Seconde note de bas de page, avec des « guillemets français » et un accent : élément vérifié.",
    ])


# --------------------------------------------------------------------------
# Fixture 3 -- fidelite-03.xlsx
# --------------------------------------------------------------------------

def build_fidelite_03(out_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Ventes"

    ws.merge_cells("A1:F1")
    ws["A1"] = "Suivi des ventes — Fixture 03"
    ws["A1"].font = Font(size=14, bold=True)
    ws["A1"].alignment = Alignment(horizontal="center")

    headers = ["Date", "Produit", "Quantité", "Prix unitaire", "% Marge", "Montant"]
    for j, htext in enumerate(headers, start=1):
        c = ws.cell(row=2, column=j, value=htext)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="2F5496")
        c.alignment = Alignment(horizontal="center")

    thin = Side(style="thin", color="999999")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    products = ["Casque audio", "Clavier mécanique", "Souris ergonomique", "Écran 27\"", "Webcam HD"]
    for i in range(40):
        row = i + 3
        qty = 5 + (i % 12)
        price = 19.9 + (i % 7) * 15.5
        margin = 0.10 + (i % 5) * 0.03
        ws.cell(row=row, column=1, value=__import__("datetime").date(2026, 1, 1 + (i % 27))).number_format = "DD/MM/YYYY"
        ws.cell(row=row, column=2, value=products[i % len(products)])
        ws.cell(row=row, column=3, value=qty)
        c_price = ws.cell(row=row, column=4, value=round(price, 2))
        c_price.number_format = '#,##0.00 "€"'
        c_margin = ws.cell(row=row, column=5, value=round(margin, 3))
        c_margin.number_format = "0.0%"
        c_amount = ws.cell(row=row, column=6, value=round(qty * price, 2))
        c_amount.number_format = '#,##0.00 "€"'
        for col in range(1, 7):
            ws.cell(row=row, column=col).border = border

    ws.freeze_panes = "A3"

    color_scale = ColorScaleRule(
        start_type="min", start_color="F8696B",
        mid_type="percentile", mid_value=50, mid_color="FFEB84",
        end_type="max", end_color="63BE7B",
    )
    ws.conditional_formatting.add("F3:F42", color_scale)

    chart = BarChart()
    chart.title = "Montant par ligne"
    chart.y_axis.title = "Montant (€)"
    chart.x_axis.title = "Ligne"
    data = Reference(ws, min_col=6, min_row=2, max_row=42)
    chart.add_data(data, titles_from_data=True)
    ws.add_chart(chart, "H2")

    ws.print_area = "A1:P42"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"

    for col, width in zip("ABCDEF", [12, 20, 10, 14, 10, 14]):
        ws.column_dimensions[col].width = width

    wb.save(out_path)


# --------------------------------------------------------------------------
# Fixture 4 -- fidelite-04.xlsx
# --------------------------------------------------------------------------

def build_fidelite_04(out_path):
    wb = Workbook()

    ws1 = wb.active
    ws1.title = "Commandes"
    ws1["A1"] = "ID"
    ws1["B1"] = "Client"
    ws1["C1"] = "Description (colonne très large avec retour à la ligne)"
    ws1["D1"] = "Quantité"
    ws1["E1"] = "Prix"
    ws1["F1"] = "Total"
    for cell in ws1[1]:
        cell.font = Font(bold=True)
    long_desc = (
        "Cette description est volontairement longue pour vérifier que le "
        "retour à la ligne automatique (wrap text) et une largeur de colonne "
        "explicitement très large sont bien respectés après conversion en PDF."
    )
    for i in range(10):
        row = i + 2
        ws1.cell(row=row, column=1, value=1000 + i)
        ws1.cell(row=row, column=2, value=f"Client {i+1}")
        c = ws1.cell(row=row, column=3, value=long_desc)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws1.cell(row=row, column=4, value=3 + i)
        ws1.cell(row=row, column=5, value=9.99 + i)
        ws1.cell(row=row, column=6, value=f"=D{row}*E{row}")
    ws1.column_dimensions["A"].width = 8
    ws1.column_dimensions["B"].width = 14
    ws1.column_dimensions["C"].width = 90
    ws1.column_dimensions["D"].width = 10
    ws1.column_dimensions["E"].width = 10
    ws1.column_dimensions["F"].width = 12
    for i in range(10):
        ws1.row_dimensions[i + 2].height = 40

    ws2 = wb.create_sheet("Seuils")
    ws2["A1"] = "Total commande"
    ws2["B1"] = "Statut"
    for i in range(10):
        row = i + 2
        ws2.cell(row=row, column=1, value=f"=Commandes!F{row}")
        ws2.cell(row=row, column=2, value=f'=IF(A{row}>100,"Priorité","Standard")')

    ws3 = wb.create_sheet("Recherche")
    ws3["A1"] = "ID recherché"
    ws3["B1"] = "Client trouvé (VLOOKUP)"
    ws3["A2"] = 1003
    ws3["B2"] = '=VLOOKUP(A2,Commandes!A:B,2,FALSE)'
    ws3["A3"] = 1007
    ws3["B3"] = '=VLOOKUP(A3,Commandes!A:B,2,FALSE)'

    wb.save(out_path)


# --------------------------------------------------------------------------
# Fixture 5 -- fidelite-05.pptx
# --------------------------------------------------------------------------

def build_fidelite_05(out_path, fullbleed_png):
    prs = Presentation()

    master = prs.slide_masters[0]
    try:
        master.background.fill.solid()
        master.background.fill.fore_color.rgb = PRGBColor(0x1F, 0x2A, 0x44)
        title_ph = master.shapes.title
        if title_ph is not None:
            for para in title_ph.text_frame.paragraphs:
                for run in para.runs:
                    run.font.color.rgb = PRGBColor(0xFF, 0xFF, 0xFF)
                    run.font.name = "Cambria"
    except Exception:
        pass

    layout_title = prs.slide_layouts[1]
    slide1 = prs.slides.add_slide(layout_title)
    slide1.shapes.title.text = "Fixture 05 — Masque, puces, image, graphique, notes"
    body = slide1.placeholders[1]
    tf = body.text_frame
    tf.text = "Axe stratégique 1"
    tf.paragraphs[0].level = 0
    for text, level in [
        ("Sous-point A", 1),
        ("Sous-point B", 1),
        ("Axe stratégique 2", 0),
        ("Sous-point C", 1),
    ]:
        p = tf.add_paragraph()
        p.text = text
        p.level = level
    slide1.notes_slide.notes_text_frame.text = (
        "Notes de l'intervenant pour la diapositive 1 : rappeler le contexte "
        "budgétaire avant de présenter les axes stratégiques."
    )

    blank_layout = prs.slide_layouts[6]
    slide2 = prs.slides.add_slide(blank_layout)
    slide2.shapes.add_picture(fullbleed_png, 0, 0, width=prs.slide_width, height=prs.slide_height)
    slide2.notes_slide.notes_text_frame.text = "Image plein écran servant de séparateur de section."

    slide3 = prs.slides.add_slide(layout_title)
    slide3.shapes.title.text = "Répartition budgétaire"
    chart_data = CategoryChartData()
    chart_data.categories = ["R&D", "Marketing", "Support", "Infrastructure"]
    chart_data.add_series("Budget 2026", (35, 25, 15, 25))
    x, y, cx, cy = PInches(1.5), PInches(1.8), PInches(7), PInches(5)
    slide3.shapes.add_chart(XL_CHART_TYPE.PIE, x, y, cx, cy, chart_data)
    slide3.notes_slide.notes_text_frame.text = (
        "Notes de l'intervenant pour la diapositive 3 : détailler la ventilation "
        "du budget par poste et justifier la part R&D."
    )

    prs.save(out_path)


# --------------------------------------------------------------------------
# Fixture 6 -- fidelite-06.pptx
# --------------------------------------------------------------------------

def build_fidelite_06(out_path):
    prs = Presentation()
    prs.slide_width = PEmu(12192000)
    prs.slide_height = PEmu(6858000)

    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)

    box1 = slide.shapes.add_textbox(PInches(0.7), PInches(0.6), PInches(6), PInches(1.5))
    tf1 = box1.text_frame
    tf1.text = "Titre superposé (police absente : Segoe UI)"
    tf1.paragraphs[0].font.size = PPt(32)
    tf1.paragraphs[0].font.name = "Segoe UI"
    tf1.paragraphs[0].font.bold = True

    box2 = slide.shapes.add_textbox(PInches(3.5), PInches(1.3), PInches(6), PInches(1.5))
    tf2 = box2.text_frame
    tf2.text = "Zone de texte chevauchante, pour vérifier l'ordre d'empilement (z-order)."
    tf2.paragraphs[0].font.size = PPt(20)
    box2.fill.solid()
    box2.fill.fore_color.rgb = PRGBColor(0xFF, 0xFF, 0xFF)
    box2.fill.transparency = 0.0

    shape1 = slide.shapes.add_shape(1, PInches(0.7), PInches(3.0), PInches(4), PInches(2))
    shape1.fill.gradient()
    stops = shape1.fill.gradient_stops
    stops[0].color.rgb = PRGBColor(0x1F, 0x6F, 0xEB)
    stops[0].position = 0.0
    stops[1].color.rgb = PRGBColor(0xE8, 0x3E, 0x8C)
    stops[1].position = 1.0
    shape1.text_frame.text = "Forme à dégradé"

    rows, cols = 3, 3
    table_shape = slide.shapes.add_table(rows, cols, PInches(6.5), PInches(3.0), PInches(5.5), PInches(2))
    table = table_shape.table
    table.cell(0, 0).text = "Poste"
    table.cell(0, 1).text = "Q1"
    table.cell(0, 2).text = "Q2"
    table.cell(1, 0).text = "Ventes"
    table.cell(1, 1).text = "120"
    table.cell(1, 2).text = "150"
    table.cell(2, 0).text = "Coûts"
    table.cell(2, 1).text = "80"
    table.cell(2, 2).text = "95"

    slide.notes_slide.notes_text_frame.text = (
        "16:9, zones de texte superposées, forme à dégradé, tableau, police "
        "Segoe UI absente du conteneur Linux -> observer la police de "
        "substitution utilisée dans le PDF."
    )

    prs.save(out_path)


# --------------------------------------------------------------------------

def main():
    diagram_png = os.path.join(HERE, "_asset_diagram.png")
    watermark_png = os.path.join(HERE, "_asset_watermark.png")
    fullbleed_png = os.path.join(HERE, "_asset_fullbleed.png")
    make_diagram_png(diagram_png)
    make_watermark_png(watermark_png)
    make_fullbleed_png(fullbleed_png)

    build_fidelite_01(os.path.join(HERE, "fidelite-01.docx"), diagram_png)
    build_fidelite_02(os.path.join(HERE, "fidelite-02.docx"), watermark_png)
    build_fidelite_03(os.path.join(HERE, "fidelite-03.xlsx"))
    build_fidelite_04(os.path.join(HERE, "fidelite-04.xlsx"))
    build_fidelite_05(os.path.join(HERE, "fidelite-05.pptx"), fullbleed_png)
    build_fidelite_06(os.path.join(HERE, "fidelite-06.pptx"))

    for f in ("_asset_diagram.png", "_asset_watermark.png", "_asset_fullbleed.png"):
        os.remove(os.path.join(HERE, f))

    print("Fixtures generated in", HERE)


if __name__ == "__main__":
    main()
