// P37 (06/10) — Arabic PDFs for the invisible text layer of PDF Redact (scripts/p37/redact-arabic-layer.test.mjs):
// the same 7 lines (Arabic, Arabic + digits + Latin, lam-alef, harakat, an e-mail address) printed by
//   - Chromium (Playwright's, page.pdf: Skia, Type 0 fonts, as Chrome's "Save as PDF" and our Gotenberg) in Noto Naskh
//     Arabic, Tahoma and Arial (fonts of this Windows machine);
//   - this site's Text to PDF (app/lib/textPdf.js: pdf-lib + fontkit, Noto Sans Arabic, Type 0), its fonts read from
//     public/ instead of fetched;
//   - LibreOffice (soffice --headless, simple TrueType fonts) in Noto Naskh Arabic, Arial, Tahoma, Times New Roman and Segoe UI, when soffice answers
//     within 120 s (skipped otherwise, and said).
// Writes <out>/chrome-<font>.pdf, <out>/site-text-to-pdf.pdf, <out>/lo-<font>.pdf and <out>/lines.json (the lines in reading order).
//   node scripts/p37/make-arabic-fixtures.mjs [out dir, default %TEMP%\p37-arabic]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const OUT = process.argv[2] || path.join(os.tmpdir(), 'p37-arabic');
fs.mkdirSync(OUT, { recursive: true });
export const LINES = [
  'تقرير المبيعات السنوي 2025',
  'بلغت المبيعات 1250 وحدة في شهر مارس الماضي',
  'تم الاجتماع مع شركة Microsoft في الرياض يوم 15 مايو',
  'السلام عليكم ورحمة الله وبركاته لا إله إلا الله',
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  'رقم الهاتف 0551234567 والبريد info@example.com',
  'نهاية التقرير السري للشركة',
];
fs.writeFileSync(path.join(OUT, 'lines.json'), JSON.stringify(LINES, null, 1));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const b = await chromium.launch();
const p = await b.newPage();
for (const font of ['Noto Naskh Arabic', 'Tahoma', 'Arial']) {
  await p.setContent(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><body style="font-family:'${font}';font-size:16pt;line-height:1.9;margin:60px">${LINES.map((l) => `<p style="margin:0 0 10px">${esc(l)}</p>`).join('')}</body></html>`);
  const file = path.join(OUT, `chrome-${font.replace(/ /g, '')}.pdf`);
  await p.pdf({ path: file, format: 'A4' });
  console.log('written', file);
}
await b.close();

globalThis.fetch = async (u) => ({ ok: true, status: 200, arrayBuffer: async () => { const b = fs.readFileSync(path.join(ROOT, 'public', String(u))); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); } });
const { textToPdf } = await import(pathToFileURL(path.join(ROOT, 'app/lib/textPdf.js')).href);
fs.writeFileSync(path.join(OUT, 'site-text-to-pdf.pdf'), await textToPdf(LINES.join(String.fromCharCode(10)), { fontSize: 14 }));
console.log('written', path.join(OUT, 'site-text-to-pdf.pdf'));

const SOFFICE = process.env.SOFFICE || 'C:\\Program Files\\LibreOffice\\program\\soffice.com';
// P37 second review (N5): names a lam-alef reading must not touch — "سالم" (Salem) next to "السلام", "فالح" (Faleh)
// next to "الفلاح" — in lo-Arial-names.pdf
export const NAMES = ['زارنا سالم أمس في المكتب', 'وقال السلام عليكم للجميع', 'وصل المهندس فالح اليوم', 'نجاح الفلاح في العمل'];
fs.writeFileSync(path.join(OUT, 'names.json'), JSON.stringify(NAMES, null, 1));
for (const [font, tag0, lines] of [...['Noto Naskh Arabic', 'Arial', 'Tahoma', 'Times New Roman', 'Segoe UI'].map((fn) => [fn, null, LINES]), ['Arial', 'Arial-names', NAMES]]) {
  const tag = tag0 || font.replace(/ /g, '');
  const fodt = path.join(OUT, `lo-${tag}.fodt`);
  fs.writeFileSync(fodt, `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.3" office:mimetype="application/vnd.oasis.opendocument.text">
<office:font-face-decls><style:font-face style:name="F" svg:font-family="'${font}'"/></office:font-face-decls>
<office:automatic-styles><style:style style:name="P" style:family="paragraph"><style:paragraph-properties fo:text-align="start" style:writing-mode="rl-tb" fo:margin-bottom="0.25cm"/><style:text-properties style:font-name="F" fo:font-size="14pt" style:font-name-complex="F" style:font-size-complex="14pt" style:language-complex="ar" style:country-complex="SA"/></style:style></office:automatic-styles>
<office:body><office:text>
${lines.map((l) => `<text:p text:style-name="P">${esc(l)}</text:p>`).join('\n')}
</office:text></office:body></office:document>`);
  try {
    const profile = `file:///${path.join(os.tmpdir(), 'p37-lo-profile').replace(/\\/g, '/')}`;
    execFileSync(SOFFICE, [`-env:UserInstallation=${profile}`, '--headless', '--convert-to', 'pdf', '--outdir', OUT, fodt], { stdio: 'ignore', timeout: 120000 });
    console.log('written', fodt.replace(/\.fodt$/, '.pdf'));
  } catch (e) { console.log(`LibreOffice skipped for ${font}: ${e.message.split('\n')[0]}`); }
}
