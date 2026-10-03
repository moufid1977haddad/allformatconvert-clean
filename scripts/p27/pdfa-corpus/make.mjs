// P27 phase 1: builds the multilingual part of the permanent PDF/A corpus (scripts/p27/pdfa-corpus/*.pdf) from three
// real producers, all with fonts embedded as SUBSETS: Chromium (tagged and untagged, as Chrome / Edge "Save as PDF"
// and our Gotenberg HTML tools make them), LibreOffice (as our Word/Excel/PowerPoint to PDF tools and most office
// exports make them) and pdf-lib + fontkit (as the site's own browser tools make them).
// Texts: Greek, Arabic, Chinese, French accents (precomposed AND decomposed), ligatures (fi, fl, ffi, ffl, ti, st).
// The 20 PDFs of P26 sit next to them (copied from P26's bench, see README.md).
//   node scripts/p27/pdfa-corpus/make.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p27-corpus-'));
const SOFFICE = process.env.SOFFICE || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

const TEXTS = {
  greek: ['Ελληνικά: η γλώσσα της Ελλάδας και της Κύπρου.', 'Καλημέρα κόσμε — αβγδεζηθικλμνξοπρστυφχψω ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ.', 'Ψηφιακή αρχειοθέτηση εγγράφων για πολλά χρόνια.'],
  arabic: ['اللغة العربية لغة رسمية في اثنتين وعشرين دولة.', 'مرحبا بالعالم — حفظ المستندات على المدى الطويل.', 'الأرقام: ١٢٣٤٥٦٧٨٩٠'],
  chinese: ['中文：长期保存电子文档的国际标准。', '你好，世界！这是一个测试文件。', '繁體中文：檔案長期保存。'],
  french: ['Données numérisées : fidélité, intégrité, sécurité — à conserver « tel quel ».', 'Œuvre, cœur, Noël, garçon, où, déjà, été, Ça.'],
  ligatures: ['office, affiche, efficient, fluffy, waffle, baffled, final, flow, fjord.', 'section, action, attention, nation, station, motion, first, list, stick.'],
};
// "é" as e + U+0301: some producers print it as two glyphs; the text must survive as it is
const DECOMPOSED = 'Decomposed: cafe\u0301, re\u0301sume\u0301, nai\u0308ve, Zu\u0308rich.';

const html = (font, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:${font};font-size:15pt;margin:2cm;font-variant-ligatures:common-ligatures}
.ar{direction:rtl;font-family:'Noto Naskh Arabic','Arial',sans-serif}.zh{font-family:'Microsoft YaHei','SimSun',sans-serif}
.lig{font-family:Calibri,Cambria,serif}</style></head><body>
<h1>PDF/A text check — P27</h1>
${TEXTS.greek.map((t) => `<p lang="el">${t}</p>`).join('')}
${TEXTS.arabic.map((t) => `<p class="ar" lang="ar">${t}</p>`).join('')}
${TEXTS.chinese.map((t) => `<p class="zh" lang="zh">${t}</p>`).join('')}
${TEXTS.french.map((t) => `<p lang="fr">${t}</p>`).join('')}
${TEXTS.ligatures.map((t) => `<p class="lig">${t}</p>`).join('')}
<p>${DECOMPOSED}</p>${extra}</body></html>`;

async function chromePdfs() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, font] of [['calibri', 'Calibri,sans-serif'], ['georgia-arial', 'Arial,sans-serif']]) {
    await page.setContent(html(font), { waitUntil: 'load' });
    await page.pdf({ path: path.join(here, `p27-chrome-${name}-tagged.pdf`), format: 'A4', tagged: true });
    await page.pdf({ path: path.join(here, `p27-chrome-${name}-untagged.pdf`), format: 'A4', tagged: false });
  }
  await browser.close();
}

function libreofficePdfs() {
  // A real .docx (python-docx: one run per paragraph, fonts named) opened and exported by LibreOffice, like our
  // Word to PDF does it (Gotenberg runs the same LibreOffice export).
  const docx = path.join(tmp, 'p27-lo-multilingual.docx');
  const py = `
import docx, sys, json
from docx.shared import Pt
from docx.oxml.ns import qn
T = json.loads(sys.argv[2])
d = docx.Document()
d.add_heading('PDF/A text check — P27', 1)
def para(text, font, rtl=False, east=None):
    p = d.add_paragraph()
    r = p.add_run(text)
    r.font.name = font
    r.font.size = Pt(13)
    rpr = r._element.get_or_add_rPr()
    fonts = rpr.find(qn('w:rFonts'))
    for k in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        fonts.set(qn(k), east or font)
    if rtl:
        b = rpr.makeelement(qn('w:rtl'), {}); rpr.append(b)
for t in T['greek']: para(t, 'Arial')
for t in T['arabic']: para(t, 'Arial', rtl=True)
for t in T['chinese']: para(t, 'Microsoft YaHei', east='Microsoft YaHei')
for t in T['french']: para(t, 'Calibri')
for t in T['ligatures']: para(t, 'Calibri')
para(T['decomposed'], 'Calibri')
d.save(sys.argv[1])
`;
  execFileSync('python', ['-c', py, docx, JSON.stringify({ ...TEXTS, decomposed: DECOMPOSED })]);
  const profile = `file:///${tmp.replace(/\\/g, '/')}/lo-profile`;
  for (const [suffix, filter] of [['tagged', 'pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}'], ['untagged', 'pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"false"}}']]) {
    const outDir = path.join(tmp, suffix);
    execFileSync(SOFFICE, [`-env:UserInstallation=${profile}`, '--headless', '--convert-to', filter, '--outdir', outDir, docx], { stdio: 'ignore' });
    fs.copyFileSync(path.join(outDir, 'p27-lo-multilingual.pdf'), path.join(here, `p27-lo-multilingual-${suffix}.pdf`));
  }
}

async function pdfLibPdf() {
  // pdf-lib + fontkit with subset: true -- what the site's own browser tools (Text to PDF, Watermark...) produce.
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = {
    latin: await doc.embedFont(fs.readFileSync('C:/Windows/Fonts/NotoSans-Regular.ttf'), { subset: true }),
    calibri: await doc.embedFont(fs.readFileSync('C:/Windows/Fonts/calibri.ttf'), { subset: true }),
  };
  const page = doc.addPage([595, 842]);
  let y = 790;
  const line = (t, font) => { page.drawText(t, { x: 50, y, size: 13, font }); y -= 24; };
  line('PDF/A text check — P27 (pdf-lib, subset fonts)', fonts.latin);
  TEXTS.greek.forEach((t) => line(t, fonts.latin));
  TEXTS.french.forEach((t) => line(t, fonts.latin));
  TEXTS.ligatures.forEach((t) => line(t, fonts.calibri));
  fs.writeFileSync(path.join(here, 'p27-pdflib-subset.pdf'), await doc.save());
}

await chromePdfs();
libreofficePdfs();
await pdfLibPdf();
fs.rmSync(tmp, { recursive: true, force: true });
console.log('corpus written to', here);
