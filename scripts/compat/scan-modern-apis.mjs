// Lists every use, in the built client code (.next/static) and in public/ (hand-written workers), of a JavaScript
// or DOM API that Safari 16.4 / iOS 16.4 (Next.js's own browser floor, `supported-browsers.md`) does not have.
// Each hit is printed with its context so a person can tell a feature-detected use from an unguarded one.
// Usage: node scripts/compat/scan-modern-apis.mjs [--summary]
import fs from 'node:fs';
import path from 'node:path';

// name, regex, Safari version that added it (MDN / WebKit release notes)
export const MODERN_APIS = [
  ['Promise.try', /\bPromise\.try\b/g, '18.2'],
  ['Promise.withResolvers', /\bPromise\.withResolvers\b/g, '17.4'],
  ['Object.groupBy', /\bObject\.groupBy\b/g, '17.4'],
  ['Map.groupBy', /\bMap\.groupBy\b/g, '17.4'],
  ['Set methods (union/intersection/difference/...)', /\.(?:union|intersection|difference|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\(/g, '17.0'],
  ['Iterator helpers', /\bIterator\.(?:from|prototype)\b|\.values\(\)\.(?:map|filter|take|drop|flatMap|reduce|toArray|forEach|some|every|find)\(|\.keys\(\)\.(?:map|filter|toArray)\(|\.entries\(\)\.(?:map|filter|toArray)\(/g, '18.4'],
  ['RegExp.escape', /\bRegExp\.escape\b/g, '18.2'],
  ['Float16Array / Math.f16round', /\bFloat16Array\b|\bMath\.f16round\b/g, '18.2'],
  ['Uint8Array base64/hex', /\bUint8Array\.from(?:Base64|Hex)\b|\.toBase64\(|\.toHex\(|\.setFromBase64\(|\.setFromHex\(/g, '18.2'],
  ['Math.sumPrecise', /\bMath\.sumPrecise\b/g, '26'],
  ['URL.parse', /\bURL\.parse\(/g, '18.0'],
  ['URL.canParse', /\bURL\.canParse\(/g, '17.0'],
  ['ArrayBuffer transfer', /\.transferToFixedLength\(|\.transfer\(\s*\)/g, '17.4'],
  ['AbortSignal.any', /\bAbortSignal\.any\(/g, '17.4'],
  ['ReadableStream.from', /\bReadableStream\.from\(/g, 'not in 17'],
  ['Blob/Response .bytes()', /\.bytes\(\)/g, '18.0'],
  ['requestIdleCallback', /\brequestIdleCallback\b/g, 'not in 17'],
  ['Error.isError', /\bError\.isError\b/g, '26'],
  ['Array.fromAsync', /\bArray\.fromAsync\b/g, '16.4'],
  ['Element.checkVisibility', /\.checkVisibility\(/g, '17.4'],
  ['startViewTransition', /\bstartViewTransition\b/g, '18.0'],
  ['showSaveFilePicker / showOpenFilePicker', /\bshow(?:Save|Open)FilePicker\b|\bshowDirectoryPicker\b/g, 'never'],
  ['FileSystemFileHandle.createWritable', /\.createWritable\(/g, '26'],
  ['scheduler.postTask / yield', /\bscheduler\.(?:postTask|yield)\b/g, 'never'],
  ['ImageDecoder (WebCodecs)', /\bnew ImageDecoder\b|\bImageDecoder\.isTypeSupported\b/g, '26'],
  ['AudioEncoder / AudioDecoder', /\bnew Audio(?:En|De)coder\b/g, '26'],
  ['EyeDropper', /\bEyeDropper\b/g, 'never'],
  ['import attributes (with {type})', /\bwith\s*\{\s*type\s*:/g, '17.2'],
  ['Array.prototype.group', /\.groupToMap\(|\.group\(\s*\(/g, 'never'],
  ['String.prototype.isWellFormed', /\.(?:is|to)WellFormed\(/g, '16.4'],
  ['Intl.DurationFormat', /\bIntl\.DurationFormat\b/g, '16.4'],
  ['CompressionStream deflate-raw', /['"]deflate-raw['"]/g, '16.4'],
  ['async iteration of a ReadableStream', /for\s+await\s*\(\s*(?:const|let|var)\s+\w+\s+of\s+[\w.]*(?:body|stream|readable)\b/gi, 'not in 17'],
];

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(m?js)$/.test(e.name)) yield p;
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('scan-modern-apis.mjs')) {
  const summary = process.argv.includes('--summary');
  const roots = ['.next/static', 'public'];
  const totals = {};
  for (const root of roots) for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const [name, re, since] of MODERN_APIS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        totals[name] = (totals[name] || 0) + 1;
        if (!summary) console.log(`${name} [Safari ${since}] ${file}:${m.index}\n    …${src.slice(Math.max(0, m.index - 140), m.index + 90).replace(/\s+/g, ' ')}…`);
      }
    }
  }
  console.log('\nTOTALS', JSON.stringify(totals, null, 1));
}
