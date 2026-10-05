// P20 (01/10): no page may promise that nothing is sent when its tool sends the visitor's file or text to a server.
//
// 1. Which tools send data is read from the CODE (page, files next to it, and the shared tool shells it renders), never
//    from the page's words: a call to one of the processing APIs, the media service, the staged upload, the Office /
//    transcription helpers or the Opus encoder.
// 2. For each of those tools, every sentence of the page and of its metadata (layout.tsx) that says the work is local
//    ("entirely in your browser", "nothing is uploaded", "never leaves your device", "client-side", "100% private",
//    "no data stored"…) must carry its exception in the same sentence ("except for Opus", "in fast mode", "your original
//    file … only the extracted text"…) or be a negative answer to the server case. An unqualified one fails.
// 3. Site-wide surfaces (home page, category pages, About, the root metadata) may not make an absolute claim for all
//    tools ("No data stored", "every tool runs in your browser") — only scoped ones ("most tools").
// 4. Cross-check with the privacy policy: every server tool must be named in /privacy, so the page it links to
//    tells the truth too.
//
// Usage: node scripts/content-checks/privacy-claims.mjs [--verbose]   (exit 1 on any failure)
import fs from 'node:fs';
import path from 'node:path';
import { toolPages, readPage, readOwn } from './instructions.mjs';
import { inventory } from './claims-inventory.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const verbose = process.argv.includes('--verbose');

// What a tool calls when it sends data somewhere (app/lib/officeUpload.js, mediaJob.js, opusService.js, aiClient.js).
// The Web Speech API is not local either: Chrome sends the recording to Google's speech service, Edge to Microsoft's,
// Safari to Apple's, unless the page asks for on-device recognition (processLocally, Chrome 139+).
export const SENDS_VIA_BROWSER = /\b(webkit)?SpeechRecognition\b/;
export const SENDS = /\/api\/(ai|ai-detect|ai-image|ai-transcribe|ai-vision|convert-html-to-pdf|convert-to-pdf|image-upscale|media\/ticket|pdf-compress|pdf-repair|pdf-to-excel|pdf-to-pdfa|pdf-to-ppt|pdf-to-word|remove-bg)\b|\b(runMediaJob|runStaged\w*|convertOffice|transcribeAudio|encodeOpusOnService|readAiJson)\b|<(MediaServiceTool|GifFromVideoTool)\b/;

// A sentence that says the work is local / nothing is sent or kept.
const LOCAL = /\b(entirely (in|on) your (browser|device)|(right|all|directly) in your browser|in your browser|on your device|locally|client-side|nothing (is |gets )?(uploaded|sent|stored|transmitted)|never (leaves?|uploaded|sent|stored)|not (uploaded|sent)|no (file )?uploads?|no data stored|100 ?% (private|local)|completely private|(entirely|fully|all) local|stays? (in|on) your (browser|device))\b/i;
// The same sentence names its exception, or is about the part that really is local.
// Only an exception named in the sentence itself, or a sentence that itself says where the data goes. Words like
// "but", "then", "while" or a format name are NOT enough (independent review, 01/10: a format list containing "Opus"
// let "your file is not uploaded" pass).
const QUALIFIED = /\b(except|exception|unless|only (if|when|for|the|your|a|its)|otherwise|when (your|you|the|it|that)|for (the gif|the fast|a precise|every format except|that fast)|in (fast|default) mode|"instant, lossless"|instant, lossless|original (epub|mobi|pdf|file)|the pdf itself|frame extraction|not for|files over|before (sending|it is sent|upload)|sent (to|through|by)|our (own )?(\w+ )?(server|service)s?|openai|pangram|convertapi|server-side|usually|(file|content|text|audio|image|video) (is|are) (uploaded|sent))\b/i;

// Sentences that are true as written although the tool also uses a server: status lines shown only on the local path,
// or statements about the part that is local. Page and start of the sentence, with the reason. Read on 01/10 (P20).
const ALLOW = [
  ['ai-tools/image-upscaler', 'Running on your device: your image is not uploaded', "shown only when the model ran on the device (where === 'device')"],
  ['ai-tools/image-upscaler', 'The AI ran right here, in your browser', "shown only when where === 'device'"],
  ['ai-tools/image-upscaler', 'The first run on your device downloads the AI model', 'about the model download, not about the image'],
  ['pdf-tools/pdf-compress', 'Optimising in your browser', 'progress label of the in-browser path (files over the server limit)'],
  ['pdf-tools/pdf-compress', ', so it will be optimised in your browser', 'notice shown only for files over the server limit'],
  ['pdf-tools/pdf-compress', 'are optimised entirely in your browser and never leave your device', 'second half of "Files over … are optimised…", after the server case is stated'],
  ['pdf-tools/pdf-to-excel', 'You still get a workbook', 'the no-table fallback really is built in the browser'],
  ['audio-tools/audio-merger', 'No limit is set by the tool', 'about the input files, which are decoded on the device even for Opus output'],
  ['video-tools/video-trimmer', 'Trimming runs in your browser', "about the fast cut's declared memory limit"],
  ['video-tools/video-trimmer', 'MB on a phone, shown before you pick a file', "about the fast cut's declared memory limit"],
  ['video-tools/video-merger', 'Videos that are alike', 'the condition is the start of the sentence; the next sentence says the others go to our video service'],
  ['video-tools/video-resizer', 'It no longer has to play the whole video in your browser', 'says the opposite: the work left the browser'],
  ['video-tools/video-to-gif', 'Yes: "Or extract frames as PNG images" captures', 'the PNG frame extraction really is local; the GIF answer is separate'],
  ['video-tools/video-to-gif', 'Open "Or extract frames as PNG images"', 'same: frame extraction is local'],
];

// Questions are not claims; "Is my file uploaded?" is answered by the next string.
const isQuestion = (t) => /\?\s*$/.test(t.trim());

function sentences(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z"“(])/).map((s) => s.trim()).filter(Boolean);
}

const failures = [];
const fail = (where, what, sentence) => failures.push({ where, what, sentence });

// ---- 1 + 2: tool pages ----------------------------------------------------------------------------------------------
const pages = toolPages();
const serverSlugs = [];
for (const { slug, file } of pages) {
  const { instr, rest, code } = readPage(file);
  // The shells' own code (MediaServiceTool, GifFromVideoTool) is in `code` already (local imports, two levels).
  const pageCode = fs.readFileSync(file, 'utf8');
  const sibling = fs.readdirSync(path.dirname(file)).filter((f) => /\.(jsx|tsx|js|ts)$/.test(f) && !/^layout\./.test(f) && !/^LegacyPage\./.test(f))
    .map((f) => fs.readFileSync(path.join(path.dirname(file), f), 'utf8')).join('\n');
  const direct = pageCode + '\n' + sibling;
  if (!SENDS.test(direct) && !(SENDS_VIA_BROWSER.test(direct) && !/processLocally/.test(direct))) continue;
  serverSlugs.push(slug);
  const layout = path.join(path.dirname(file), 'layout.tsx');
  const meta = fs.existsSync(layout) ? readOwn(layout).rest.filter((t) => /\s/.test(t)) : [];
  // Visible words: the page's own strings and those of the files next to it (local components), not the shells'
  // internals and not LegacyPage (the in-browser fallback shown only when the media service is not configured, where
  // its words are true).
  const own = { instr: [], rest: [] };
  for (const f of [file, ...fs.readdirSync(path.dirname(file)).filter((f) => /\.(jsx|tsx)$/.test(f) && !/^(page|layout|LegacyPage)\./.test(f)).map((f) => path.join(path.dirname(file), f))]) {
    const o = readOwn(f); own.instr.push(...o.instr); own.rest.push(...o.rest);
  }
  const words = [...own.instr, ...own.rest.filter((t) => /\s/.test(t) && t.length > 12), ...meta];
  for (const t of words) {
    if (isQuestion(t)) continue;
    for (const s of sentences(t)) {
      if (LOCAL.test(s) && !QUALIFIED.test(s) && !ALLOW.some(([sl, start]) => sl === slug && s.startsWith(start))) fail(slug, 'server tool claims local processing', s);
    }
  }
  // A server tool may not promise "no limits": every server path has an hourly and daily limit per connection.
  for (const t of words) for (const s of sentences(t)) {
    if (/\b(no (usage )?limits?|(or|and) usage limits?|unlimited|no limit on how many)\b/i.test(s) && !/\b(in your browser|except|unless|only)\b/i.test(s) && !ALLOW.some(([sl, start]) => sl === slug && s.startsWith(start))) fail(slug, 'server tool claims no limits', s);
  }
  // A provider is named: a tool whose route goes to ConvertAPI says so on its page (not "our conversion service").
  if (/\/api\/(pdf-to-word|pdf-to-excel|pdf-to-ppt)\b/.test(direct) || (slug === 'pdf-tools/word-to-pdf')) {
    if (!words.some((t) => /ConvertAPI/.test(t))) fail(slug, 'ConvertAPI not named on the page', '(no sentence names ConvertAPI)');
  }
  void instr; void rest; void code;
}

// ---- 3: site-wide surfaces ---------------------------------------------------------------------------------------
const ABSOLUTE = /\b(no data stored|nothing is stored|we (never|don'?t) store|every tool runs|all (our |the )?tools run|everything (runs|happens) in your browser|never leaves your device|100 ?% private|completely private|works in your browser)\b/i;
// Surface sentences that are true as written. File and start of the sentence, with the reason (01/10, P20).
const SURFACE_ALLOW = [
  ['app/HomeClient.jsx', 'We only read the file type', "home page drop zone: it reads file.name only and suggests a tool"],
  ['app/HomeClient.jsx', 'Your file stays on your device', 'same drop zone'],
];
const SCOPED = /\b(most|many|some|except|exception|unless|the others|these|this tool|for those|the tools that|such as|instead|when your browser)\b/i;
const SURFACES = /^app\/(page\.jsx|layout\.tsx|about\/|components\/(Footer|Navbar)|tools\/[^/]+\/page\.jsx|tools\/page\.jsx)/;
const rows = inventory();
for (const r of rows) {
  if (!SURFACES.test(r.file)) continue;
  if (SURFACE_ALLOW.some(([f, start]) => r.file === f && r.sentence.startsWith(start))) continue;
  if ((ABSOLUTE.test(r.sentence) || LOCAL.test(r.sentence)) && !SCOPED.test(r.sentence)) {
    // A category page may say it for its own tools only when none of them sends data.
    const m = r.file.match(/^app\/tools\/([^/]+)\/page\.jsx$/);
    if (m && !serverSlugs.some((s) => s.startsWith(m[1] + '/'))) continue;
    fail(r.file + ':' + r.line, 'site-wide absolute claim', r.sentence);
  }
}

// ---- 4: every server tool is named in the privacy policy -------------------------------------------------------
const privacy = fs.readFileSync(path.join(ROOT, 'app', 'privacy', 'page.jsx'), 'utf8').toLowerCase().replace(/&nbsp;/g, ' ');
const NAME = { 'gif-tools/video-to-gif': 'video, mp4, mov, avi and webm to gif', 'gif-tools/mp4-to-gif': 'mp4', 'gif-tools/mov-to-gif': 'mov', 'gif-tools/avi-to-gif': 'avi', 'gif-tools/webm-to-gif': 'webm to gif',
  'ai-tools/image-upscaler': 'ai image upscaler', 'pdf-tools/pdf-ai-summary': 'pdf ai summary', 'pdf-tools/ppt-to-pdf': 'powerpoint to pdf', 'pdf-tools/pdf-to-ppt': 'pdf to powerpoint',
  'video-tools/video-to-gif': 'video, mp4, mov, avi and webm to gif', 'ai-tools/ai-chatbot': 'ai chatbot', 'pdf-tools/pdf-to-pdfa': 'pdf to pdf/a', 'pdf-tools/pdf-merge': 'merge pdf' };
for (const slug of serverSlugs) {
  const name = (NAME[slug] || slug.split('/')[1].replace(/-/g, ' ')).toLowerCase();
  if (!privacy.includes(name)) fail(slug, 'server tool not named in /privacy', name);
}

// ---- 5: Google Translate sends the page's text (results included) to Google: /privacy and the menu say so ------
if (!/sent to google to be translated/.test(privacy)) fail('app/privacy/page.jsx', 'Google Translate: the page text sent to Google is not disclosed', '');
if (!/the page&apos;s text is sent to Google/.test(fs.readFileSync(path.join(ROOT, 'app', 'components', 'Navbar.jsx'), 'utf8'))) fail('app/components/Navbar.jsx', 'language menu does not say the text goes to Google', '');

// ---- 6: the About page's figures (P36) -- app/lib/serverToolCount.json must be what this check measures ------------
const countFile = path.join(ROOT, 'app', 'lib', 'serverToolCount.json');
// "server" = tools that send data in at least one case: the ones above, plus the iPhone / iPad fallbacks that draw or
// recognize a page on our PDF service (app/lib/serverPageRender.js, serverPageOcr.js), found through the page's imports.
const FALLBACK = /serverPageRender|serverPageOcr|\/api\/pdf-(render|ocr)/;
const fallbackSlugs = toolPages().filter(({ slug, file }) => !serverSlugs.includes(slug) && FALLBACK.test(readPage(file).code)).map((p) => p.slug);
const measured = { total: toolPages().length, server: serverSlugs.length + fallbackSlugs.length, iosFallbackOnly: fallbackSlugs.length };
const stored = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile, 'utf8')) : null;
if (!stored || stored.total !== measured.total || stored.server !== measured.server || stored.iosFallbackOnly !== measured.iosFallbackOnly) fail('app/lib/serverToolCount.json', 'About page figures out of date', `stored ${JSON.stringify(stored)}, measured ${JSON.stringify(measured)} -- write the measured values`);

for (const f of failures) console.log(`FAIL ${f.where} — ${f.what}${verbose || f.what !== 'x' ? `\n    “${f.sentence.slice(0, 300)}”` : ''}`);
console.log(`${serverSlugs.length} tools send data (read from the code); ${failures.length} failure(s)`);
if (verbose) console.log(serverSlugs.join('\n'));
process.exit(failures.length ? 1 : 0);
