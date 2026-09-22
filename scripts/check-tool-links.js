#!/usr/bin/env node
// Validates every { title, href } tool card in app/tools/*/page.jsx against
// the real route files on disk. Catches the class of bug where a card's
// href points to the wrong tool (wrong slug, wrong category, or a duplicate
// of another card's href, which also breaks React's key prop).
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'app', 'tools');
const ENTRY_RE = /\{\s*title:\s*'([^']*)',\s*description:\s*'([^']*)',\s*href:\s*'([^']*)'\s*\}/g;
const STOPWORDS = new Set(['and', 'to', 'a', 'of', 'the', 'pdf', 'generator', 'viewer', 'converter', 'calculator', 'class', 'struct', 'file', 'files']);
const KEYWORD_OVERLAP_THRESHOLD = 0.4;

function keywords(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s#]+/g, ' ').split(/\s+/).filter(w => w && !STOPWORDS.has(w));
}

function pageExists(category, slug) {
  const dir = path.join(TOOLS_DIR, category, slug);
  return fs.existsSync(path.join(dir, 'page.jsx')) || fs.existsSync(path.join(dir, 'page.tsx'));
}

const categories = fs.readdirSync(TOOLS_DIR).filter(d => fs.statSync(path.join(TOOLS_DIR, d)).isDirectory());
const issues = [];

for (const cat of categories) {
  const pageFile = path.join(TOOLS_DIR, cat, 'page.jsx');
  if (!fs.existsSync(pageFile)) continue;
  const src = fs.readFileSync(pageFile, 'utf8');

  const entries = [];
  let m;
  while ((m = ENTRY_RE.exec(src))) {
    entries.push({ title: m[1], href: m[3] });
  }

  const seenHrefs = new Map();
  for (const { title, href } of entries) {
    const dup = seenHrefs.get(href);
    if (dup) {
      issues.push(`[${cat}] duplicate href "${href}" used by both "${dup}" and "${title}" (breaks React key, second link is dead)`);
    }
    seenHrefs.set(href, title);

    const parts = href.split('/').filter(Boolean); // ['tools', category, slug]
    const [, targetCat, slug] = parts;
    if (!targetCat || !slug) {
      issues.push(`[${cat}] malformed href "${href}" on "${title}"`);
      continue;
    }
    if (!pageExists(targetCat, slug)) {
      issues.push(`[${cat}] "${title}" links to "${href}" but app/tools/${targetCat}/${slug}/page.jsx does not exist`);
      continue;
    }

    const titleWords = keywords(title);
    const slugWords = slug.split('-');
    const matched = titleWords.filter(w => slugWords.some(sw => sw.includes(w) || w.includes(sw)));
    const ratio = titleWords.length ? matched.length / titleWords.length : 1;
    if (ratio < KEYWORD_OVERLAP_THRESHOLD) {
      issues.push(`[${cat}] "${title}" doesn't look like it matches its href "${href}" (keyword overlap ${(ratio * 100).toFixed(0)}%) — verify manually`);
    }
  }
}

// Displayed tool counts. The homepage and /tools page are client components, so
// their server-rendered HTML shows hardcoded fallbacks until /api/tool-counts
// answers: those fallbacks must equal the real number of WORKING tools (a
// "Coming Soon" page, marked noindex, is not one -- same rule as lib/toolCounts.js
// and the sitemap). They had drifted: "225+" shown for 222 working tools.
const NOINDEX_RE = /robots\s*:\s*\{[^}]*index\s*:\s*false/;
const realCounts = {};
let realTotal = 0;
for (const cat of categories) {
  const catDir = path.join(TOOLS_DIR, cat);
  realCounts[cat] = fs.readdirSync(catDir).filter((slug) => {
    const dir = path.join(catDir, slug);
    if (!fs.statSync(dir).isDirectory() || !pageExists(cat, slug)) return false;
    const layout = ['layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js'].map((f) => path.join(dir, f)).find((p) => fs.existsSync(p));
    return !(layout && NOINDEX_RE.test(fs.readFileSync(layout, 'utf8')));
  }).length;
  realTotal += realCounts[cat];
}
const COUNT_SOURCES = [
  { file: path.join(__dirname, '..', 'app', 'page.jsx'), re: /href: '\/tools\/([a-z-]+)',[^\n]*?count: (\d+)/g },
  { file: path.join(__dirname, '..', 'app', 'tools', 'page.jsx'), re: /href: '\/tools\/([a-z-]+)',[^\n]*?count: (\d+)/g },
  { file: path.join(__dirname, '..', 'app', 'lib', 'toolsRegistry.js'), re: /'([a-z-]+)':\s*\{[^}]*count: (\d+)/g },
];
for (const { file, re } of COUNT_SOURCES) {
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(src))) {
    const [, cat, shown] = m;
    if (cat in realCounts && Number(shown) !== realCounts[cat]) {
      issues.push(`${path.relative(process.cwd(), file)}: "${cat}" shows count ${shown}, but it has ${realCounts[cat]} working tools`);
    }
  }
}
const homeSrc = fs.readFileSync(COUNT_SOURCES[0].file, 'utf8');
const defaultTotal = Number((/DEFAULT_TOOL_COUNT = (\d+)/.exec(homeSrc) || [])[1]);
if (defaultTotal !== realTotal) {
  issues.push(`app/page.jsx: DEFAULT_TOOL_COUNT is ${defaultTotal}, but there are ${realTotal} working tools`);
}

if (issues.length) {
  console.error(`\nx check-tool-links found ${issues.length} issue(s):\n`);
  issues.forEach(i => console.error('  - ' + i));
  console.error('');
  process.exit(1);
}

console.log('check-tool-links: all tool card links are valid.');
