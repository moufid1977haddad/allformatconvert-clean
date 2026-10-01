"""Real test files for the Office formats added to Word / Excel / PowerPoint to PDF (P21, 02/10).

- OOXML variants (.docm .dotx .dotm .xlsm .xltx .xltm .pptm .ppsx .ppsm .potx .potm) are the project's own fidelity
  fixtures with the main part's content type changed to the variant's (what Office writes for each);
- OpenDocument (.odt .ott .ods .ots .odp .otp) and .rtf are written here by hand, valid per the specifications;
- legacy binaries (.doc → .dot, .ppt → .pps/.pot), .xlsb, Works .wps and WordPerfect .wpd are LibreOffice's own
  public test documents (github.com/LibreOffice/core, MPL-2.0), downloaded once.
Each file carries a recognisable sentence, checked in the PDF by e2e-office-formats.mjs.
Usage: python scripts/p21/office-fixtures.py  → docs/audit/fixtures-p21-office/
"""
import io, os, re, urllib.request, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'audit', 'fixtures-p21-office')
os.makedirs(OUT, exist_ok=True)
FID = os.path.join(ROOT, 'docs', 'audit', 'fixtures-fidelite')
LO = 'https://raw.githubusercontent.com/LibreOffice/core/master/'


def variant(src, dst, main_part, new_type):
    zin = zipfile.ZipFile(src)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == '[Content_Types].xml':
                s = data.decode('utf-8')
                s2 = re.sub(r'(<Override PartName="%s" ContentType=")[^"]+(")' % re.escape(main_part), r'\g<1>%s\g<2>' % new_type, s)
                assert s2 != s, (src, main_part)
                data = s2.encode('utf-8')
            z.writestr(item, data)
    open(os.path.join(OUT, dst), 'wb').write(buf.getvalue())


W = os.path.join(FID, 'fidelite-01.docx')
X = os.path.join(FID, 'fidelite-03.xlsx')
P = os.path.join(FID, 'fidelite-05.pptx')
for ext, t in {'docm': 'application/vnd.ms-word.document.macroEnabled.main+xml',
               'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml',
               'dotm': 'application/vnd.ms-word.template.macroEnabledTemplate.main+xml'}.items():
    variant(W, 'word.' + ext, '/word/document.xml', t)
for ext, t in {'xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.main+xml',
               'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml',
               'xltm': 'application/vnd.ms-excel.template.macroEnabled.main+xml'}.items():
    variant(X, 'sheet.' + ext, '/xl/workbook.xml', t)
for ext, t in {'pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml',
               'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml',
               'ppsm': 'application/vnd.ms-powerpoint.slideshow.macroEnabled.main+xml',
               'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template.main+xml',
               'potm': 'application/vnd.ms-powerpoint.template.macroEnabled.main+xml'}.items():
    variant(P, 'slides.' + ext, '/ppt/presentation.xml', t)

SENT = 'P21 format check: the quick brown fox jumps over the lazy dog.'
NS = ('xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
      'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" '
      'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" '
      'xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" office:version="1.3"')
BODIES = {
    'text': f'<office:text><text:p>{SENT}</text:p></office:text>',
    'spreadsheet': f'<office:spreadsheet><table:table table:name="Sheet1"><table:table-row><table:table-cell office:value-type="string"><text:p>{SENT}</text:p></table:table-cell>'
                   '<table:table-cell office:value-type="float" office:value="42"><text:p>42</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet>',
    'presentation': f'<office:presentation><draw:page draw:name="page1"><draw:frame svg:x="2cm" svg:y="2cm" svg:width="20cm" svg:height="4cm"><draw:text-box><text:p>{SENT}</text:p></draw:text-box></draw:frame></draw:page></office:presentation>',
}


def odf(name, kind, template=False):
    mime = f'application/vnd.oasis.opendocument.{kind}{"-template" if template else ""}'
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr(zipfile.ZipInfo('mimetype'), mime)  # first and stored, as the specification requires
        z.writestr('META-INF/manifest.xml', '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">'
                   f'<manifest:file-entry manifest:full-path="/" manifest:media-type="{mime}"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>', zipfile.ZIP_DEFLATED)
        z.writestr('content.xml', f'<?xml version="1.0" encoding="UTF-8"?><office:document-content {NS}><office:body>{BODIES[kind]}</office:body></office:document-content>', zipfile.ZIP_DEFLATED)
    open(os.path.join(OUT, name), 'wb').write(buf.getvalue())


odf('text.odt', 'text'); odf('text.ott', 'text', True)
odf('sheet.ods', 'spreadsheet'); odf('sheet.ots', 'spreadsheet', True)
odf('slides.odp', 'presentation'); odf('slides.otp', 'presentation', True)
open(os.path.join(OUT, 'text.rtf'), 'w').write('{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 ' + SENT + '\\par }')

for path, dst in [('sw/qa/extras/ww8export/data/bordercolours.doc', 'word.dot'),
                  ('sd/qa/unit/data/ppt/FillPatterns.ppt', 'slides.pps'),
                  ('sd/qa/unit/data/ppt/FillPatterns.ppt', 'slides.pot'),
                  ('sc/qa/unit/data/xlsb/universal-content.xlsb', 'sheet.xlsb'),
                  ('writerperfect/qa/unit/data/writer/libwps/pass/Works_4.5.wps', 'works.wps'),
                  ('writerperfect/qa/unit/data/writer/libwpd/pass/WP6.wpd', 'wordperfect.wpd')]:
    dest = os.path.join(OUT, dst)
    if not os.path.exists(dest):
        with urllib.request.urlopen(urllib.request.Request(LO + path, headers={'User-Agent': 'OCT-fixtures/1.0'}), timeout=60) as r:
            open(dest, 'wb').write(r.read())
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)))
