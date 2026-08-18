#!/usr/bin/env node
/**
 * Generates a server-only layout.tsx (static `metadata` export) for every
 * tool page, category page, and the /tools index under app/tools/, so each
 * gets its own <title>/description/canonical/OG tags instead of inheriting
 * the site-wide default from app/layout.tsx.
 *
 * A layout that only returns {children} has zero effect on rendering or
 * behavior, so this never touches any of the 238 existing page files.
 *
 * Content is derived from data that already exists in the project:
 *  - tool pages:      the <SeoContent title="..." description="..."/> props
 *                      already written on that tool's own page.jsx/tsx
 *  - category pages:  the short `description` field already in
 *                      app/page.jsx's `categories` array (title source) and
 *                      the "About {Category}" paragraph on the category's
 *                      own page.jsx (meta-description source)
 *  - the /tools index: the live tool count from lib/toolCounts.js
 *
 * `title` is set via `{ absolute: ... }` specifically so the root layout's
 * `"%s | OnlineConverTools"` template does NOT get appended -- these titles
 * are hand-budgeted to ~60 chars already; appending the brand name would
 * blow that budget and duplicate what's already implied by the domain.
 *
 * Usage:
 *   node scripts/generate-tool-metadata.js --dry-run   # print samples, write nothing
 *   node scripts/generate-tool-metadata.js             # write all layout.tsx files
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'app', 'tools');
const SITE_URL = 'https://www.onlineconvertools.com';
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------- helpers

function unescapeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

// Words a phrase should never dangle on when we cut it short -- prepositions,
// articles, conjunctions. Used both for the title's action phrase and for
// the description's word-boundary fallback truncation.
const FILLER_END_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'for', 'by', 'with', 'without', 'using',
  'into', 'onto', 'from', 'as', 'between', 'and', 'or', 'at', 'in', 'on',
  'that', 'which', 'is', 'are', 'via',
]);

// Strips trailing connector punctuation (em/en dash, comma, colon...) and
// then pops any trailing filler word(s), so a truncated phrase never ends
// mid-clause on a dangling preposition/article. Keeps at least 2 words.
function stripTrailingFiller(text) {
  let words = text.trim().replace(/[\s\-–—,;:]+$/, '').split(/\s+/);
  while (words.length > 2) {
    const last = words[words.length - 1].toLowerCase().replace(/[^a-z']/g, '');
    if (!FILLER_END_WORDS.has(last)) break;
    words.pop();
  }
  return words.join(' ');
}

// Truncate to maxLen without ever cutting mid-sentence or mid-word: prefer
// the last full sentence that still fits; otherwise the last full word (and
// never a dangling filler word), with a single ellipsis. Returns the text
// unchanged if it already fits.
function truncateDescription(text, maxLen = 158) {
  text = text.trim().replace(/\s+/g, ' ');
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSentenceEnd = Math.max(slice.lastIndexOf('. '), slice.endsWith('.') ? slice.length - 1 : -1);
  if (lastSentenceEnd > maxLen * 0.4) {
    return slice.slice(0, lastSentenceEnd + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(' ');
  const wordBoundary = slice.slice(0, lastSpace > 0 ? lastSpace : maxLen).trim();
  return stripTrailingFiller(wordBoundary) + '…';
}

// Pulls the tool's core action phrase out of its SeoContent description for
// use in the <title>, e.g.
//   "Merge PDF is a free online tool that lets you combine multiple PDF
//    files into a single document instantly. ..."
//   -> "combine multiple PDF files"
function extractActionPhrase(toolName, description) {
  let text = description.trim();
  const esc = toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const leadIns = [
    new RegExp(`^${esc}\\s+is a free online tool that\\s+lets you\\s+`, 'i'),
    new RegExp(`^${esc}\\s+is a free online tool that\\s+`, 'i'),
    new RegExp(`^${esc}\\s+`, 'i'),
  ];
  for (const re of leadIns) {
    if (re.test(text)) { text = text.replace(re, ''); break; }
  }
  let clause = text.split(/[.!?](?:\s|$)/)[0];
  const stops = [' — ', ', entirely', ', using ', ' using ', ', running', ', giving you', ', updating', ' — nothing'];
  for (const s of stops) {
    const i = clause.indexOf(s);
    if (i > 10) clause = clause.slice(0, i);
  }
  const words = clause.trim().split(/\s+/);
  if (words.length > 7) {
    const prepositions = ['into', 'onto', 'from', 'with', 'without', 'using', 'for', 'to', 'as', 'between', 'by', 'and', 'of', 'at'];
    let cut = 7;
    for (let i = 3; i < Math.min(words.length, 8); i++) {
      if (prepositions.includes(words[i].toLowerCase())) { cut = i; break; }
    }
    clause = words.slice(0, cut).join(' ');
  }
  return stripTrailingFiller(clause);
}

// A word like "PDF", "PDFs", "MP4", "JSON", "URLs" should keep its original
// casing rather than going through title-case lowercasing -- check with an
// optional trailing "s" stripped off first, so plurals of acronyms match too.
function looksLikeAcronym(w) {
  const bare = /s$/.test(w) ? w.slice(0, -1) : w;
  return /^[A-Z0-9]{2,6}$/.test(bare);
}

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'via']);
function titleCase(phrase) {
  const words = phrase.split(/\s+/);
  return words
    .map((w, i) => {
      if (looksLikeAcronym(w)) return w; // keep acronyms as-is: PDF, PDFs, JSON, MP4, URLs...
      const lower = w.toLowerCase();
      if (i !== 0 && i !== words.length - 1 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

// extractActionPhrase() pulls its clause straight out of "ToolName does X..."
// source text, so its leading word is always 3rd-person-singular present
// tense ("Reduces", "Parses") -- ungrammatical as a title, which reads as an
// instruction ("Reduce", "Parse"). Converts the FIRST word of a phrase only.
const IRREGULAR_VERBS = { has: 'have', does: 'do', goes: 'go', is: 'be' };
function toImperative(word) {
  const lower = word.toLowerCase();
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower];
  if (/ss$/i.test(word)) return word; // already a bare form ending in double-s (process, compress)
  if (!/s$/i.test(word)) return word; // already base form
  // sibilant + "-es" with no silent-e in the base: compress-es, match-es,
  // fix-es, buzz-es, go-es -- strip the whole "-es".
  if (/(sses|ches|shes|xes|zzes|oes)$/i.test(word)) return word.slice(0, -2);
  // "-ies" -> "-y": applies -> apply, copies -> copy
  if (/ies$/i.test(word) && word.length > 4) return word.slice(0, -3) + 'y';
  // silent-e base + "-s": reduces -> reduce, parses -> parse, removes ->
  // remove, encodes -> encode, creates -> create, analyzes -> analyze.
  if (/es$/i.test(word)) return word.slice(0, -1);
  // regular: converts -> convert, extracts -> extract, turns -> turn
  return word.slice(0, -1);
}

function imperativizePhrase(phrase) {
  const words = phrase.trim().split(/\s+/);
  if (!words.length) return phrase;
  words[0] = toImperative(words[0]);
  return words.join(' ');
}

// Some extracted clauses stay awkward even once the verb is imperative --
// most often a possessive noun-phrase object ("Reduce an Image's File
// Size"), a leftover sentence fragment, or a clause too long to read as a
// title. Detect those so buildTitle() can swap in a short, query-style
// fallback instead of forcing a bad literal extraction.
function isAwkwardPhrase(phrase) {
  return /['’]s\b/.test(phrase)
    || /^(is|are|that|which|has|have)\b/i.test(phrase)
    || phrase.split(/\s+/).length > 6;
}

// Tool names ending in an agent-noun suffix ("Image Compressor", "JSON
// Formatter") decompose cleanly into verb+object: strip the suffix for the
// object, map the suffix to its verb. Covers the tool-naming pattern used
// across the site; returns null for names that don't match (e.g. "PDF to
// Word", "Merge PDF"), which don't need a fallback since their extracted
// phrase is already clean.
const SUFFIX_VERBS = [
  ['Compressor', 'Compress'], ['Converter', 'Convert'], ['Formatter', 'Format'],
  ['Generator', 'Generate'], ['Merger', 'Merge'], ['Splitter', 'Split'],
  ['Extractor', 'Extract'], ['Detector', 'Detect'], ['Analyzer', 'Analyze'],
  ['Trimmer', 'Trim'], ['Cropper', 'Crop'], ['Rotator', 'Rotate'],
  ['Resizer', 'Resize'], ['Encoder', 'Encode'], ['Decoder', 'Decode'],
  ['Minifier', 'Minify'], ['Validator', 'Validate'], ['Viewer', 'View'],
  ['Builder', 'Build'], ['Checker', 'Check'], ['Editor', 'Edit'],
  ['Scanner', 'Scan'], ['Translator', 'Translate'], ['Transcriber', 'Transcribe'],
  ['Summarizer', 'Summarize'], ['Recorder', 'Record'], ['Cleaner', 'Clean'],
  ['Remover', 'Remove'], ['Upscaler', 'Upscale'], ['Repairer', 'Repair'],
  ['Reverser', 'Reverse'], ['Sorter', 'Sort'], ['Repeater', 'Repeat'],
  ['Encryptor', 'Encrypt'], ['Equalizer', 'Equalize'], ['Pixelator', 'Pixelate'],
  ['Inverter', 'Invert'], ['Counter', 'Count'], ['Comparator', 'Compare'],
];

const UNCOUNTABLE = new Set(['audio', 'text', 'data']);
function pluralize(word) {
  if (looksLikeAcronym(word)) return word;
  if (UNCOUNTABLE.has(word.toLowerCase())) return word;
  if (/[sxz]$|[cs]h$/i.test(word)) return word + 'es';
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  return word + 's';
}

function buildFallbackPhrase(name) {
  for (const [suffix, verb] of SUFFIX_VERBS) {
    const re = new RegExp(`\\b${suffix}$`, 'i');
    if (re.test(name)) {
      const rest = name.replace(re, '').trim();
      const object = rest ? pluralize(rest) : 'Files';
      return `${verb} ${object}`;
    }
  }
  return null;
}

// Builds a <=60-char, search-intent-style title: "{Name} — {Action} {Suffix}"
function buildTitle(name, actionPhraseRaw, maxLen = 60) {
  let actionPhrase = imperativizePhrase(actionPhraseRaw);
  if (isAwkwardPhrase(actionPhrase)) {
    const fallback = buildFallbackPhrase(name);
    if (fallback) actionPhrase = fallback;
  }
  const actionTitled = titleCase(actionPhrase);
  const suffixes = [' Online Free', ' Free Online', ' Online', ''];
  for (const suffix of suffixes) {
    const candidate = `${name} — ${actionTitled}${suffix}`;
    if (candidate.length <= maxLen) return candidate;
  }
  let words = actionTitled.split(' ');
  while (words.length > 2) {
    words.pop();
    const candidate = `${name} — ${words.join(' ')}`;
    if (candidate.length <= maxLen) return candidate;
  }
  return `${name} — ${words.join(' ')}`.slice(0, maxLen);
}

// ------------------------------------------------------------- extraction

function extractToolSeo(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const m = src.match(/<SeoContent[\s\S]*?title=(["'])((?:(?!\1)[\s\S])*)\1[\s\S]*?description=(["'])((?:(?!\3)[\s\S])*)\3/);
  if (!m) return null;
  return { title: unescapeHtml(m[2]), description: unescapeHtml(m[4]) };
}

function extractCategoryAbout(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const m = src.match(/About [^<]*<\/h2>\s*<p[^>]*>([^<]*)<\/p>/);
  return m ? unescapeHtml(m[1]) : null;
}

// Reads app/page.jsx's own `categories` array (already-existing registry:
// title, short description, slug, tool count) instead of retyping it.
function extractCategoriesRegistry() {
  const src = fs.readFileSync(path.join(ROOT, 'app', 'page.jsx'), 'utf8');
  const block = src.match(/const categories = \[([\s\S]*?)\n\];/)[1];
  const entries = [];
  const re = /title:\s*'([^']*)',\s*description:\s*'([^']*)',\s*href:\s*'([^']*)',\s*slug:\s*'([^']*)',[\s\S]*?count:\s*(\d+)/g;
  let m;
  while ((m = re.exec(block))) {
    entries.push({ title: m[1], shortDescription: m[2], href: m[3], slug: m[4], count: Number(m[5]) });
  }
  return entries;
}

// ------------------------------------------------------------ generation

function layoutSource({ title, description, canonical }) {
  return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: ${JSON.stringify(title)} },
  description: ${JSON.stringify(description)},
  alternates: { canonical: ${JSON.stringify(canonical)} },
  openGraph: {
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},
    url: ${JSON.stringify(canonical)},
  },
};

// This layout only passes its children through -- it exists solely to host
// the static \`metadata\` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
}

function toolNameFromSlug(slug) {
  // Only used as a last-resort fallback if a page has no SeoContent title.
  return slug.split('-').map(w => w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildToolEntry(categorySlug, toolSlug) {
  const pageDir = path.join(TOOLS_DIR, categorySlug, toolSlug);
  const pageFile = fs.existsSync(path.join(pageDir, 'page.tsx')) ? path.join(pageDir, 'page.tsx') : path.join(pageDir, 'page.jsx');
  const seo = extractToolSeo(pageFile);
  const name = seo ? seo.title : toolNameFromSlug(toolSlug);
  const rawDescription = seo ? seo.description : `${name} is a free online tool. No sign-up, no watermarks, no limits.`;
  const actionPhrase = extractActionPhrase(name, rawDescription);
  const title = buildTitle(name, actionPhrase);
  const description = truncateDescription(rawDescription);
  const canonical = `${SITE_URL}/tools/${categorySlug}/${toolSlug}`;
  return { dir: pageDir, title, description, canonical, name, categorySlug, toolSlug };
}

function buildCategoryEntry(cat) {
  const pageDir = path.join(TOOLS_DIR, cat.slug);
  const pageFile = path.join(pageDir, 'page.jsx');
  const about = extractCategoryAbout(pageFile) || cat.shortDescription;
  const title = buildTitle(cat.title, cat.shortDescription);
  const description = truncateDescription(about);
  const canonical = `${SITE_URL}/tools/${cat.slug}`;
  return { dir: pageDir, title, description, canonical, name: cat.title, categorySlug: cat.slug };
}

function buildIndexEntry() {
  const { getToolCounts } = require(path.join(ROOT, 'lib', 'toolCounts.js'));
  const { total } = getToolCounts();
  const title = buildTitle('All Tools', `Browse ${total}+ free file converters`);
  const description = truncateDescription(
    `Browse all ${total}+ free online tools on OnlineConverTools, organized by category: PDF, image, video, audio, GIF, developer, AI, and more. No sign-up, no watermarks, no limits.`
  );
  return { dir: TOOLS_DIR, title, description, canonical: `${SITE_URL}/tools`, name: 'All Tools', categorySlug: null };
}

// -------------------------------------------------------------------- run

const categories = extractCategoriesRegistry();
const entries = [];
entries.push(buildIndexEntry());
for (const cat of categories) {
  entries.push(buildCategoryEntry(cat));
  const catDir = path.join(TOOLS_DIR, cat.slug);
  const toolSlugs = fs.readdirSync(catDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  for (const toolSlug of toolSlugs) {
    entries.push(buildToolEntry(cat.slug, toolSlug));
  }
}

if (DRY_RUN) {
  const samples = [
    entries.find(e => e.categorySlug === 'pdf-tools' && e.toolSlug === 'pdf-merge'),
    entries.find(e => e.categorySlug === 'image-tools' && e.toolSlug === 'image-compressor'),
    entries.find(e => e.categorySlug === 'developer-tools' && e.toolSlug === 'json-formatter'),
    entries.find(e => e.categorySlug === 'pdf-tools' && !e.toolSlug),
    entries.find(e => e.categorySlug === 'image-tools' && !e.toolSlug),
    entries.find(e => e.toolSlug === 'image-resizer'),
    entries.find(e => e.toolSlug === 'video-converter'),
    entries.find(e => e.toolSlug === 'background-remover'),
  ].filter(Boolean);
  for (const e of samples) {
    console.log('='.repeat(70));
    console.log('Path:       ', path.relative(ROOT, e.dir));
    console.log('Canonical:  ', e.canonical);
    console.log(`Title (${String(e.title.length).padStart(2)} chars):`, e.title);
    console.log(`Desc  (${String(e.description.length).padStart(3)} chars):`, e.description);
  }
  console.log('='.repeat(70));
  console.log(`\n${entries.length} layout.tsx would be written (dry run -- nothing written).`);
} else {
  let written = 0;
  for (const e of entries) {
    fs.writeFileSync(path.join(e.dir, 'layout.tsx'), layoutSource(e));
    written++;
  }
  console.log(`Wrote ${written} layout.tsx files.`);
}
