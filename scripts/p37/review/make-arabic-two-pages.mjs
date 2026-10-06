// P37 review: a 2-page Arabic PDF made by LibreOffice (Arial): page 1 holds "مارس", page 2 holds lam-alef words
// ("السلام", "الله") and "Microsoft". Built from %TEMP%\p37-arabic\lo-Arial.fodt (scripts/p37/make-arabic-fixtures.mjs).
//   node scripts/p37/review/make-arabic-two-pages.mjs  → %TEMP%\p37-review-redact\ar2\two-pages.pdf
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const SRC = path.join(os.tmpdir(), 'p37-arabic', 'lo-Arial.fodt');
const DIR = path.join(os.tmpdir(), 'p37-review-redact', 'ar2');
fs.mkdirSync(DIR, { recursive: true });
let s = fs.readFileSync(SRC, 'utf8');
const paras = [...s.matchAll(/<text:p text:style-name="P">[^<]*<\/text:p>/g)].map((m) => m[0]);
const first = s.indexOf(paras[0]), last = s.indexOf(paras[paras.length - 1]) + paras[paras.length - 1].length;
const body = `${paras[1]}<text:p text:style-name="PB">السلام عليكم ورحمة الله وبركاته لا إله إلا الله</text:p>${paras[2]}`;
s = s.slice(0, first) + body + s.slice(last);
s = s.replace('</office:automatic-styles>', '<style:style style:name="PB" style:family="paragraph" style:parent-style-name="P"><style:paragraph-properties fo:break-before="page"/></style:style></office:automatic-styles>');
if (!s.includes('</office:automatic-styles>') && !s.includes('style:name="PB"')) throw new Error('no automatic styles');
fs.writeFileSync(path.join(DIR, 'two-pages.fodt'), s);
execFileSync('C:/Program Files/LibreOffice/program/soffice.exe', ['--headless', '--convert-to', 'pdf', '--outdir', DIR, path.join(DIR, 'two-pages.fodt')], { stdio: 'ignore' });
console.log(path.join(DIR, 'two-pages.pdf'), fs.existsSync(path.join(DIR, 'two-pages.pdf')));
