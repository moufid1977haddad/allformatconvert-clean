// Text to PDF in any script (30/09). A text mixing Latin with accents, Polish, Greek, Russian, Vietnamese, Arabic
// (right to left, with digits), Hebrew, Hindi, Tamil, Thai, Chinese, Japanese and Korean; Bengali refused by name; a CRLF .txt; an
// emoji refused by name. The PDF's text is extracted by Poppler (pdftotext) and must contain every line; page 1 is
// rendered to PNG (pdftoppm) for a visual check.
// Usage: node scripts/browser-tests/text-to-pdf-unicode.mjs <origin> [--browser=firefox|webkit] [--png=<out.png>]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const png = process.argv.find((a) => a.startsWith('--png='))?.slice(6);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 't2p-'));
const LINES = [
  'Café déjà vu — naïve façade, Straße.',
  'Zażółć gęślą jaźń (Polish).',
  'Ελληνικά: Καλημέρα κόσμε.',
  'Русский: Съешь же ещё этих мягких французских булок.',
  'Tiếng Việt: Xin chào thế giới.',
  'العربية: مرحبا بالعالم 2026',
  'עברית: שלום עולם',
  'हिन्दी: नमस्ते दुनिया',
  'தமிழ்: வணக்கம் உலகம்',
  'ไทย: สวัสดีชาวโลก',
  '中文：你好，世界。',
  '日本語：こんにちは世界',
  '한국어: 안녕하세요 세계',
];
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function convert(text, file) {
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.goto(origin + '/tools/pdf-tools/text-to-pdf', { waitUntil: 'networkidle' });
  if (file) { await p.getByRole('button', { name: /Upload/ }).first().click(); await p.locator('input[type=file]').setInputFiles(file); }
  else await p.getByPlaceholder('Paste your text here...').fill(text);
  await p.getByRole('button', { name: /Convert to PDF/ }).click();
  const link = p.getByRole('link', { name: 'Download PDF' });
  const ok = await link.waitFor({ timeout: 180000 }).then(() => true, () => false);
  if (!ok) { const t = await p.locator('body').innerText(); await ctx.close(); return { error: (t.match(/Error:[^\n]*/) || ['no result'])[0] }; }
  const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const f = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f); await ctx.close();
  return { f, name: d.suggestedFilename() };
}
const r = await convert(LINES.join('\n'));
if (r.error) check('multilingual text', false, r.error);
else {
  const txt = execFileSync('pdftotext', ['-enc', 'UTF-8', r.f, '-']).toString('utf8');
  const norm = (s) => s.normalize('NFC').replace(/\s+/g, '');
  // Right-to-left lines come out of a PDF in visual order: compared without order, as sets of letters.
  const found = LINES.filter((l) => { const want = norm(l); return norm(txt).includes(want) || [...want].every((c) => norm(txt).includes(c)); });
  check(`every line's characters are in the PDF text (${found.length}/${LINES.length})`, found.length === LINES.length, LINES.filter((l) => !found.includes(l)).join(' | '));
  const size = fs.statSync(r.f).size;
  check(`fonts subset: the PDF stays small (${(size / 1e3).toFixed(0)} KB)`, size < 400e3);
  if (png) { execFileSync('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', '-singlefile', r.f, png.replace(/\.png$/, '')]); console.log('page 1 rendered to', png); }
}
const crlf = path.join(dir, 'windows-notes.txt'); fs.writeFileSync(crlf, 'Ligne un\r\nЛиния два\r\n\tTabulation');
const c = await convert(null, crlf);
check('.txt with CRLF and a tab -> PDF named after it', !c.error && c.name === 'windows-notes.pdf', c.error || c.name);
const bn = await convert('বাংলা: ওহে বিশ্ব');
check('Bengali: refused with a clear message (conjuncts would be wrong), no PDF', !!bn.error && /Bengali/.test(bn.error), bn.error || 'a PDF was made');
const e = await convert('Hello 👋 world');
check('emoji: refused by name, no broken PDF', !!e.error && e.error.includes('👋'), e.error || 'a PDF was made');
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
