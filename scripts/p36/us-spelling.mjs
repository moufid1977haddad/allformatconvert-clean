// P36: American spelling in the SEO texts of the tool pages (SeoContent props / seo objects) and their layout metadata.
// Only string literals inside those objects are touched; a word inside a quoted interface label ("Text colour") is kept
// as the interface writes it, since the label is the reference (scripts/content-checks/instructions.mjs).
//   node scripts/p36/us-spelling.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { toolPages } from '../content-checks/instructions.mjs';

const write = process.argv.includes('--write');
const MAP = [
  [/\bcolour(s|ed|ful)?\b/g, (m, s = '') => 'color' + s], [/\bColour(s|ed)?\b/g, (m, s = '') => 'Color' + s],
  [/\brecognis(e|ed|es|ing)\b/g, (m, s) => 'recogniz' + s], [/\banalyses\b/g, () => 'analyzes'],
  [/\blicence\b/g, () => 'license'], [/\bgrey\b/g, () => 'gray'], [/\bGrey\b/g, () => 'Gray'],
  [/\bbehaviour(s)?\b/g, (m, s = '') => 'behavior' + s], [/\bcentre(d|s)?\b/g, (m, s = '') => 'center' + (s === 'd' ? 'ed' : s)],
  [/\boptimis(e|ed|es|ing)\b/g, (m, s) => 'optimiz' + s],
];
const KEYS = new Set(['description', 'howTo', 'howToTitle', 'faqs', 'tips', 'specs', 'privacy', 'privacyTitle', 'specsTitle', 'example', 'title', 'openGraph', 'q', 'a', 'label', 'value', 'caption']);
let changed = 0; const files = new Set();

function fixText(t) {
  // keep text between double quotes / curly quotes (interface labels) as is
  return t.split(/("[^"]*"|“[^”]*”)/).map((part, i) => (i % 2 ? part : MAP.reduce((acc, [re, f]) => acc.replace(re, f), part))).join('');
}

function processFile(file, inSeo) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const visit = (n, seo) => {
    let s = seo;
    if (!s && inSeo(n, sf)) s = true;
    if (s && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n))) {
      const start = n.getStart(sf), end = n.getEnd();
      const raw = src.slice(start, end);
      const fixed = fixText(raw);
      if (fixed !== raw) edits.push([start, end, fixed]);
    }
    ts.forEachChild(n, (c) => visit(c, s));
  };
  visit(sf, false);
  if (!edits.length) return;
  let out = src;
  for (const [s, e, t] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + t + out.slice(e);
  changed += edits.length; files.add(file);
  if (write) fs.writeFileSync(file, out);
}

const nameOf = (n) => (n.name && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name)) ? n.name.text : null);
for (const { file } of toolPages()) {
  // the page: SeoContent attributes and seo objects (an object literal with description + howTo/faqs)
  processFile(file, (n, sf) => ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && n.tagName.getText(sf) === 'SeoContent')
    || (ts.isObjectLiteralExpression(n) && n.properties.some((p) => nameOf(p) === 'description') && n.properties.some((p) => ['howTo', 'faqs'].includes(nameOf(p)))));
  const layout = path.join(path.dirname(file), 'layout.tsx');
  if (fs.existsSync(layout)) processFile(layout, (n, sf) => ts.isVariableDeclaration(n) && n.name.getText(sf) === 'metadata');
}
console.log(`${changed} string(s) in ${files.size} file(s) ${write ? 'rewritten' : 'would change'}`);
for (const f of files) console.log('  ' + path.relative(process.cwd(), f));
