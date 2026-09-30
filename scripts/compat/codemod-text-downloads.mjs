// P18 step 3: tools whose result is text in a read-only box (formatters, converters, generators, AI text) get the
// site's download row right under that box — as Code Beautify, JSON Formatter, ConvertCase and QuillBot offer
// "Download". The file name carries the format the tool produces. Usage: node scripts/compat/codemod-text-downloads.mjs [--write]
import fs from 'node:fs';

const NAMES = {
  'ai-tools/ai-paraphraser': 'paraphrased.txt', 'ai-tools/ai-translator': 'translation.txt', 'ai-tools/ai-writer': 'text.txt',
  'ai-tools/data-extractor': 'extracted-data.txt', 'ai-tools/email-generator': 'email.txt', 'ai-tools/grammar-fixer': 'corrected.txt',
  'ai-tools/image-captioner': 'caption.txt', 'ai-tools/keyword-extractor': 'keywords.txt', 'ai-tools/sentiment-analyzer': 'sentiment.txt',
  'ai-tools/text-summarizer': 'summary.txt', 'pdf-tools/pdf-translate': 'translation.txt',
  'developer-tools/base64-encoder': 'base64.txt', 'developer-tools/css-formatter': 'formatted.css',
  'developer-tools/env-to-json': 'env.json', 'developer-tools/hex-to-text': 'converted.txt', 'developer-tools/html-encoder': 'encoded.txt',
  'developer-tools/html-entity-decoder': 'decoded.txt', 'developer-tools/html-formatter': 'formatted.html',
  'developer-tools/javascript-formatter': 'formatted.js', 'developer-tools/js-minifier': 'minified.js',
  'developer-tools/json-formatter': 'formatted.json', 'developer-tools/json-minifier': 'minified.json',
  'developer-tools/json-to-csharp': 'Model.cs', 'developer-tools/json-to-csv': 'data.csv', 'developer-tools/json-to-go': 'model.go',
  'developer-tools/json-to-php': 'data.php', 'developer-tools/json-to-python': 'model.py', 'developer-tools/json-to-rust': 'model.rs',
  'developer-tools/json-to-toml': 'data.toml', 'developer-tools/json-to-typescript': 'types.ts', 'developer-tools/json-to-xml': 'data.xml',
  'developer-tools/json-to-yaml': 'data.yaml', 'developer-tools/markdown-to-html': 'document.html', 'developer-tools/scss-to-css': 'styles.css',
  'developer-tools/sql-formatter': 'formatted.sql', 'developer-tools/sql-to-csv': 'data.csv', 'developer-tools/toml-to-json': 'data.json',
  'developer-tools/tsv-to-csv': 'data.csv', 'developer-tools/typescript-to-js': 'script.js', 'developer-tools/unicode-converter': 'converted.txt',
  'developer-tools/url-encoder': 'encoded.txt', 'developer-tools/xml-formatter': 'formatted.xml', 'developer-tools/xml-to-json': 'data.json',
  'developer-tools/yaml-to-json': 'data.json',
  'text-tools/duplicate-remover': 'deduplicated.txt', 'text-tools/find-replace': 'replaced.txt', 'text-tools/lorem-ipsum': 'lorem-ipsum.txt',
  'text-tools/text-encryptor': 'encrypted.txt', 'text-tools/text-repeater': 'repeated.txt', 'text-tools/text-reverser': 'reversed.txt',
  'text-tools/text-sorter': 'sorted.txt', 'text-tools/text-to-list': 'list.txt', 'text-tools/text-truncator': 'truncated.txt',
  'text-tools/url-encoder': 'encoded.txt', 'text-tools/whitespace-remover': 'cleaned.txt',
};
const write = process.argv.includes('--write');
for (const [tool, name] of Object.entries(NAMES)) {
  const file = `app/tools/${tool}/page.jsx`;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('<TextDownload')) { console.log('already', tool); continue; }
  const re = /<textarea\b[^>]*?\/>/gs;
  let m, hit = null;
  while ((m = re.exec(s))) if (/\breadOnly\b/.test(m[0]) && /value=\{(\w+)\}/.test(m[0])) { hit = m; break; }
  if (!hit) { console.log('NO READONLY TEXTAREA', tool); continue; }
  const v = /value=\{(\w+)\}/.exec(hit[0])[1];
  const lineStart = s.lastIndexOf('\n', hit.index) + 1;
  const indent = /^\s*/.exec(s.slice(lineStart))[0].replace(/[\r\n]/g, '');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  const end = hit.index + hit[0].length;
  s = s.slice(0, end) + `${nl}${indent}<TextDownload text={${v}} name="${name}" />` + s.slice(end);
  console.log('ok', tool, v, name);
  if (write) fs.writeFileSync(file, s);
}
