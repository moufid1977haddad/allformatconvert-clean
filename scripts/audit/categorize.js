// Scans every app/tools/**/page.{jsx,tsx} and classifies it by the kind of
// interaction the functional audit needs to drive: file upload, paste-text,
// form/generator, recorder, or stub ("Coming Soon"). Tools that call an
// internal /api/* route are additionally flagged as external-dependent
// (AI/API tools), which the audit treats with a lighter-touch check.
// Outputs scripts/audit/tool-config.json.
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', '..', 'app', 'tools');
const OUT_FILE = path.join(__dirname, 'tool-config.json');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/^page\.(jsx|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function urlPathFor(filePath) {
  const rel = path.relative(TOOLS_DIR, path.dirname(filePath)).split(path.sep).join('/');
  return '/tools' + (rel ? '/' + rel : '');
}

function isCategoryIndexPage(urlPath) {
  // /tools or /tools/<category> (exactly one segment after /tools) with no further slug
  const segments = urlPath.split('/').filter(Boolean); // ['tools', ...]
  return segments.length <= 2;
}

const files = walk(TOOLS_DIR);
const tools = [];

for (const file of files) {
  const urlPath = urlPathFor(file);
  if (isCategoryIndexPage(urlPath)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const slug = urlPath.split('/').pop();

  const hasFileInput = /type=["']file["']/.test(src);
  // A <textarea> only counts as an *input* if at least one instance isn't
  // readOnly -- several generator tools (lorem-ipsum, subtitle-generator)
  // render their result into a readOnly textarea with no textarea input at
  // all, which a naive `/<textarea/` test misreads as "this is a paste tool".
  const textareaTags = src.match(/<textarea\b[^>]*>/g) || [];
  const hasTextarea = textareaTags.some(tag => !/readOnly/.test(tag));
  const isStub = /Coming Soon/.test(src);
  const callsInternalApi = /fetch\(\s*['"]\/api\//.test(src);
  // getUserMedia/getDisplayMedia = the tool captures a *live* mic/webcam/screen
  // feed, which is what actually needs the fake-media-device runner. Bare
  // MediaRecorder is excluded: several file-upload tools (e.g. video-converter)
  // use it purely to re-encode an already-uploaded file via captureStream(),
  // which the ordinary file-upload runner handles fine.
  const isLiveCapture = /getUserMedia|getDisplayMedia/.test(src);
  const usesCanvasOnly = /<canvas/.test(src) && !hasFileInput && !hasTextarea;
  // Some tools (Text to PDF, Audio to Text) offer two independent input
  // modes behind a toggle -- e.g. paste-or-upload, mic-or-upload -- with the
  // file input only mounting once its mode is selected. Treating them as
  // plain file-upload makes the runner miss the (often-default) other mode
  // entirely, so they get their own strategy that tries both.
  const isDualMode = hasFileInput && hasTextarea;

  const acceptMatch = src.match(/accept=["']([^"']+)["']/);
  const accept = acceptMatch ? acceptMatch[1].split(',').map(s => s.trim()) : null;

  let category;
  if (isStub) category = 'stub';
  else if (isDualMode) category = 'dual-mode';
  else if (hasFileInput) category = 'file-upload';
  else if (isLiveCapture) category = 'recorder';
  else if (hasTextarea) category = 'paste-text';
  else if (usesCanvasOnly) category = 'canvas-only';
  else category = 'form-generator';

  // h1 text, best-effort, for a human-readable label in the report
  const h1Match = src.match(/<h1[^>]*>([^<{]*)/);

  tools.push({
    slug,
    urlPath,
    file: path.relative(path.join(__dirname, '..', '..'), file).split(path.sep).join('/'),
    label: h1Match ? h1Match[1].trim() : slug,
    category,
    acceptedFileTypes: accept,
    callsInternalApi,
  });
}

tools.sort((a, b) => a.urlPath.localeCompare(b.urlPath));

const summary = tools.reduce((acc, t) => {
  acc[t.category] = (acc[t.category] || 0) + 1;
  return acc;
}, {});
const apiCount = tools.filter(t => t.callsInternalApi).length;

fs.writeFileSync(OUT_FILE, JSON.stringify(tools, null, 2));
console.log('Total tools classified:', tools.length);
console.log('By category:', JSON.stringify(summary, null, 2));
console.log('Also call an internal /api/* route (external-dependent):', apiCount);

// Surface the distinct accepted file-type set, to see exactly which fixture
// formats are actually required (rather than guessing).
const allAccepts = new Set();
tools.forEach(t => (t.acceptedFileTypes || []).forEach(a => allAccepts.add(a)));
console.log('Distinct accept values seen across file-upload tools:');
console.log([...allAccepts].sort().join(' '));
