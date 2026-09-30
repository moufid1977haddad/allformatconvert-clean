// Text to PDF, emoji and every common script (P18 step 4 bis, 01/10). As a visitor:
//   1. the owner's sentence "Hello 👋🏽 world. Élodie à Montréal. বাংলা. 中文. العربية." -> the page says, BEFORE
//      converting, that the text goes to our PDF service; the PDF offered is real, and its text read back (pdf.js)
//      holds every piece: the emoji with its skin tone, the accents, Bengali, Chinese, Arabic;
//   2. a line of 24 scripts + colour emoji (flags, family, heart) -> all read back;
//   3. a Latin / Cyrillic / Chinese text stays in the browser: no request to the PDF service, the PDF read back.
// Needs the PDF service (Gotenberg): a preview or www.
// Usage: node scripts/browser-tests/text-to-pdf-scripts.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const textOf = async (bytes) => {
  const d = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  let t = '';
  for (let i = 1; i <= d.numPages; i++) t += (await (await d.getPage(i)).getTextContent()).items.map((x) => x.str + (x.hasEOL ? '\n' : '')).join('') + '\n';
  return t.normalize('NFC');
};
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());

async function run(label, text, { expectRenderer, pieces }) {
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const calls = []; p.on('request', (r) => { if (/convert-html-to-pdf|\/v1\/jobs/.test(r.url())) calls.push(r.url()); });
  await p.goto(origin + '/tools/pdf-tools/text-to-pdf', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.getByPlaceholder('Paste your text here...').fill(text);
  const note = await p.locator('[data-renderer-note]').isVisible();
  check(`${label}: ${expectRenderer ? 'says before converting that the text goes to our PDF service' : 'no upload notice (made in the browser)'}`, note === expectRenderer);
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  await p.locator('[data-file-download]').first().waitFor({ timeout: 120000 });
  const bytes = Buffer.from(await p.evaluate(async () => Array.from(new Uint8Array(await (await fetch(document.querySelector('[data-file-download] a[data-download]').href)).arrayBuffer()))));
  check(`${label}: a real PDF (${bytes.length} bytes)`, bytes.subarray(0, 5).toString() === '%PDF-');
  const read = await textOf(bytes);
  const missing = pieces.filter((x) => !read.includes(x.normalize('NFC')));
  check(`${label}: every piece read back from the PDF`, missing.length === 0, `missing ${JSON.stringify(missing)} in ${JSON.stringify(read.slice(0, 300))}`);
  check(`${label}: ${expectRenderer ? 'made by our PDF service' : 'nothing sent to a server'}`, expectRenderer ? calls.length > 0 : calls.length === 0, calls.join(' '));
  check(`${label}: no page error`, errors.length === 0, errors.join(' | '));
  await p.close();
  return read;
}

const owner = 'Hello 👋🏽 world. Élodie à Montréal. বাংলা. 中文. العربية.';
const r1 = await run('owner sentence', owner, { expectRenderer: true, pieces: ['Hello', '👋🏽', 'world.', 'Élodie à Montréal.', 'বাংলা', '中文', 'العربية'] });
console.log('   read back:', JSON.stringify(r1.trim()));
const many = ['ਪੰਜਾਬੀ', 'ગુજરાતી', 'తెలుగు', 'ಕನ್ನಡ', 'മലയാളം', 'සිංහල', 'မြန်မာ', 'ខ្មែរ', 'አማርኛ', 'ქართული', 'Հայերեն', '한국어', '日本語', 'ภาษาไทย', 'ລາວ', 'עברית', 'தமிழ்', 'हिन्दी', 'Ελληνικά', 'Русский', 'Tiếng Việt', '🇫🇷', '❤️', '🎉'];
await run('24 scripts and colour emoji', many.join(' · '), { expectRenderer: true, pieces: many });
await run('Latin / Cyrillic / Chinese stay in the browser', 'Café crème — Привет — 你好', { expectRenderer: false, pieces: ['Café crème', 'Привет', '你好'] });
await b.close();
console.log(fails ? `${fails} FAIL (${name})` : `ALL PASS (${name})`);
process.exit(fails ? 1 : 0);
