// Build guard (P18, 01/10): every file a tool makes is offered through the site's one download component
// (app/components/FileDownload.jsx: name, format, size, "Download", "Save / Share" on iPhone/iPad, "Download all (ZIP)"
// when there are several). An iPad visitor saw only a file name that opened the PDF (Split PDF, 29/09); the result
// links had grown tool by tool in a dozen styles.
// Fails the build when:
//   - a tool page (or a file next to it, or a shared component) writes its own download link (`download=` in JSX,
//     `x.download = ...` in code) outside the component — the few documented exceptions are listed below;
//   - a tool neither uses the component nor is listed as making no file (NO_FILE, with the reason);
//   - a tool listed in NO_FILE uses the component (the list must stay true).
// Usage: node scripts/check-downloads.js  (run by `npm run build`)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'app');
const COMPONENT_USE = /<(FileDownload|DownloadGroup|TextDownload|DownloadReady|TranscriptExports|MediaInfo|PdfToImages)\b|\bMediaServiceTool\b|\bGifFromVideoTool\b/;

// Tools that make no file: their result is a figure, a verdict, a view or a live preview on the page.
const NO_FILE = {
  'ai-tools/ai-chatbot': 'a conversation',
  'ai-tools/ai-detector': 'a verdict (AI / human shares)',
  'converter-tools/color-converter': 'colour values to copy',
  'converter-tools/currency-converter': 'an amount',
  'converter-tools/unit-converter': 'a value',
  'developer-tools/api-tester': 'an HTTP response shown on the page',
  'developer-tools/aspect-ratio': 'dimensions',
  'developer-tools/color-picker': 'colour values to copy',
  'developer-tools/cron-expression': 'the meaning of a cron line and its next runs',
  'developer-tools/cron-expression-builder': 'one cron line to copy',
  'developer-tools/diff-viewer': 'a comparison view',
  'developer-tools/jwt-decoder': 'the decoded fields of a token',
  'developer-tools/number-base-converter': 'a number',
  'developer-tools/password-generator': 'a password to copy (never written to a file on purpose)',
  'developer-tools/regex-tester': 'matches shown on the page',
  'developer-tools/timestamp-converter': 'a date',
  'developer-tools/url-parser': 'the parts of a URL',
  'file-tools/file-comparator': 'a comparison verdict',
  'file-tools/file-metadata': 'properties of a file',
  'image-tools/duplicate-image-finder': 'groups of similar images on the page',
  'image-tools/image-metadata': 'properties of an image',
  'math-tools/fraction-calculator': 'a result',
  'math-tools/number-base-converter': 'a number',
  'math-tools/percentage-calculator': 'a result',
  'math-tools/roman-numeral-converter': 'a numeral',
  'math-tools/scientific-calculator': 'a result',
  'math-tools/statistics-calculator': 'figures',
  'pdf-tools/pdf-compare': 'the differences, shown on the page',
  'qr-barcodes-tools/qr-scanner': 'the decoded text',
  'text-tools/character-counter': 'counts',
  'text-tools/sticky-notes': 'notes kept in the browser',
  'text-tools/text-comparator': 'the differences, shown on the page',
  'text-tools/word-counter': 'counts',
  'video-tools/media-player': 'playback',
};
// Own download code kept on purpose (reason given in the file itself).
const OWN_DOWNLOAD_OK = {
  'app/tools/file-tools/zip-extractor/page.jsx': 'extracts one file on demand from archives of several GB and streams "Download all" (StreamSaver technique); sizes are listed per entry',
  'app/tools/audio-tools/audio-waveform/page.jsx': 'exports the waveform view as it is on screen (zoom, pan) when asked',
  'app/components/FileDownload.jsx': 'the component itself',
  'app/components/IosDownloadBridge.jsx': 'the iPhone/iPad attachment bridge',
  'app/lib/download.js': 'the saving helper used by the component',
  'app/lib/streamDownload.js': 'streamed ZIP downloads',
};

const rel = (p) => path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/');
const OWN_DOWNLOAD = /\bdownload=\{|\bdownload="|\.download\s*=\s*[^=]/;
const failures = [];

function filesOf(dir) {
  return fs.readdirSync(dir).filter((f) => /\.(jsx?|tsx?)$/.test(f) && !/^layout\./.test(f)).map((f) => path.join(dir, f));
}
for (const f of [...filesOf(path.join(ROOT, 'components')), ...filesOf(path.join(ROOT, 'lib'))]) {
  if (OWN_DOWNLOAD.test(fs.readFileSync(f, 'utf8')) && !OWN_DOWNLOAD_OK[rel(f)]) failures.push(`${rel(f)}: its own download link — use FileDownload`);
}
const seen = new Set();
let fileTools = 0;
for (const cat of fs.readdirSync(path.join(ROOT, 'tools'))) {
  const cdir = path.join(ROOT, 'tools', cat);
  if (!fs.statSync(cdir).isDirectory()) continue;
  for (const t of fs.readdirSync(cdir)) {
    const dir = path.join(cdir, t);
    if (!fs.statSync(dir).isDirectory() || !fs.readdirSync(dir).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) continue;
    const id = `${cat}/${t}`;
    seen.add(id);
    const files = filesOf(dir);
    const src = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    const comingSoon = /Coming Soon/.test(src) && !COMPONENT_USE.test(src) && src.length < 8000;
    for (const f of files) if (OWN_DOWNLOAD.test(fs.readFileSync(f, 'utf8')) && !OWN_DOWNLOAD_OK[rel(f)]) failures.push(`${rel(f)}: its own download link — use FileDownload`);
    const uses = COMPONENT_USE.test(src) || OWN_DOWNLOAD_OK[rel(path.join(dir, 'page.jsx'))];
    if (NO_FILE[id]) { if (COMPONENT_USE.test(src)) failures.push(`${id}: listed as making no file, but offers one — remove it from NO_FILE`); continue; }
    if (comingSoon) continue;
    if (!uses) failures.push(`${id}: makes a file? Offer it with FileDownload, or list the tool in NO_FILE with the reason`);
    else fileTools++;
  }
}
for (const id of Object.keys(NO_FILE)) if (!seen.has(id)) failures.push(`NO_FILE lists ${id}, which does not exist`);
if (failures.length) {
  console.error('check-downloads: ' + failures.length + ' problem(s)\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`check-downloads: ${fileTools} tools offer their files through FileDownload, ${Object.keys(NO_FILE).length} make no file (listed with the reason)`);
