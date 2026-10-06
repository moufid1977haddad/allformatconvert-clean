// P37 review n° 3: an Arabic PDF made by LibreOffice (Arial, from %TEMP%\p37-arabic\lo-Arial.fodt), one page per
// argument (lines separated by "/").
//   node scripts/p37/review/make-arabic-pages.mjs <name> "<page 1 line/line>" "<page 2 ...>" → %TEMP%\p37-review-redact\ar3\<name>.pdf
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [name, ...pages] = process.argv.slice(2);
const SRC = path.join(os.tmpdir(), 'p37-arabic', 'lo-Arial.fodt');
const DIR = path.join(os.tmpdir(), 'p37-review-redact', 'ar3');
fs.mkdirSync(DIR, { recursive: true });
let s = fs.readFileSync(SRC, 'utf8');
const paras = [...s.matchAll(/<text:p text:style-name="P">[^<]*<\/text:p>/g)].map((m) => m[0]);
const first = s.indexOf(paras[0]), last = s.indexOf(paras[paras.length - 1]) + paras[paras.length - 1].length;
const body = pages.map((pg, n) => pg.split('/').map((l, k) => `<text:p text:style-name="${n && !k ? 'PB' : 'P'}">${l}</text:p>`).join('')).join('');
s = s.slice(0, first) + body + s.slice(last);
s = s.replace('</office:automatic-styles>', '<style:style style:name="PB" style:family="paragraph" style:parent-style-name="P"><style:paragraph-properties fo:break-before="page"/></style:style></office:automatic-styles>');
fs.writeFileSync(path.join(DIR, `${name}.fodt`), s);
execFileSync('C:/Program Files/LibreOffice/program/soffice.exe', ['--headless', '--convert-to', 'pdf', '--outdir', DIR, path.join(DIR, `${name}.fodt`)], { stdio: 'ignore' });
console.log(path.join(DIR, `${name}.pdf`));
