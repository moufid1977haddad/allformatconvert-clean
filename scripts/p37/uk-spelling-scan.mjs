// P37 lot 3 — find British spellings in text a visitor can see: string literals, template parts and JSX text of
// app/, lib/, components/ (comments and identifiers are skipped). Prints one line per hit: file:line, word, context,
// and the kind of node, so each hit can be judged (an interface string or a protocol value such as a job status).
//   node scripts/p37/uk-spelling-scan.mjs [--json=out.json]
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOTS = ['app', 'lib', 'components'];
const WORDS = /\b(colour\w*|optimis\w*|recognis\w*|normalis\w*|centre[sd]?|behaviour\w*|grey\w*|licence\w*|analys(?:e|ed|es|ing)\b|customis\w*|organis\w*|summaris\w*|visualis\w*|serialis\w*|initialis\w*|sanitis\w*|minimis\w*|maximis\w*|favourit\w*|favour\w*|honour\w*|labelled|labelling|cancelled|cancelling|modelled|modelling|travelled|synchronis\w*|prioritis\w*|utilis\w*|authoris\w*|realis(?:e|ed|es|ing)\b|standardis\w*|capitalis\w*|emphasis(?:e|ed|es|ing)\b|catalogue\w*|metres?\b|litres?\b|neighbour\w*|defence|offence|practise\w*|fulfil\b|enrol\b|aluminium|grey|stylis\w*|personalis\w*|categoris\w*|digitis\w*|finalis\w*|memoris\w*|parallelis\w*|tokenis\w*|randomis\w*|anonymis\w*|apologis\w*|criticis\w*|harmonis\w*|localis\w*|materialis\w*|minimis\w*|neutralis\w*|rasteris\w*|vectoris\w*|optimiz?ation\b(?<=s)|judgement|towards|whilst|amongst|programme\w*|dialogue\w*|travell\w*|signalled|levelled|totalled|marvellous|jewellery|cheque\w*|tonne|ageing|artefact\w*|aeroplane|mould\w*|plough|sceptic\w*|storey|tyre\w*|draught\w*|grey(?:scale|ish)?)\b/gi;
const SKIP_DIR = new Set(['node_modules', '.next', 'public']);
const hits = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?|mjs)$/.test(e.name)) scan(p);
  }
}

function scan(file) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : (file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JSX));
  const visit = (n) => {
    let text = null, kind = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (ts.isImportDeclaration(n.parent) || ts.isExportDeclaration(n.parent) || (ts.isCallExpression(n.parent) && n.parent.expression.kind === ts.SyntaxKind.ImportKeyword)) return;
      text = n.text; kind = 'string';
    } else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) { text = n.text; kind = 'template'; }
    else if (n.kind === ts.SyntaxKind.JsxText) { text = n.getText(sf); kind = 'jsx'; }
    if (text) {
      for (const m of text.matchAll(WORDS)) {
        if (/^(towards|amongst|whilst)$/i.test(m[0])) continue; // valid in American English too
        const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        const ctx = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ');
        hits.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'), line, word: m[0], kind, ctx });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
for (const h of hits) console.log(`${h.file}:${h.line}\t${h.word}\t[${h.kind}]\t${h.ctx}`);
console.error(`${hits.length} hits in ${new Set(hits.map((h) => h.file)).size} files`);
const j = process.argv.find((a) => a.startsWith('--json='));
if (j) fs.writeFileSync(j.slice(7), JSON.stringify(hits, null, 1));

// --write: rewrite the visible words to American spelling, inside the same nodes only. Kept as is: a literal that is a
// bare code value ('cancelled', 'colour': compared in the code) or an id/class token (no space, has a hyphen),
// nouns and words that are also American (analyses, initialisms, stylistic).
const US = [
  [/\bcolour(s|ed|ful|ing)?\b/g, (m, s = '') => 'color' + s], [/\bColour(s|ed|ful|ing)?\b/g, (m, s = '') => 'Color' + s],
  [/\bcancelled\b/g, () => 'canceled'], [/\bCancelled\b/g, () => 'Canceled'],
  [/\bpersonalised\b/g, () => 'personalized'], [/\boptimis(e|ed|es|ing|er)\b/g, (m, s) => 'optimiz' + s],
  [/\bOptimis(e|ed|es|ing|er)\b/g, (m, s) => 'Optimiz' + s], [/\boptimisation\b/g, () => 'optimization'],
  [/\bgrey\b/g, () => 'gray'], [/\bGrey\b/g, () => 'Gray'], [/\bcentred\b/g, () => 'centered'], [/\bcentre\b/g, () => 'center'],
  [/\blabelled\b/g, () => 'labeled'], [/\brecognis(e|ed|es|ing)\b/g, (m, s) => 'recogniz' + s], [/\bpractise\b/g, () => 'practice'],
];
if (process.argv.includes('--write')) {
  const byFile = new Map();
  for (const h of hits) byFile.set(h.file, true);
  let n = 0;
  for (const file of byFile.keys()) {
    const src = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : (file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JSX));
    const edits = [];
    const visit = (node) => {
      const isStr = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node);
      if (isStr || node.kind === ts.SyntaxKind.JsxText) {
        if (isStr && (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent))) return;
        const text = isStr ? node.text : node.getText(sf);
        const codeValue = isStr && (/^(cancelled|colour)$/.test(text) || (/^[\w-]+$/.test(text) && text.includes('-')));
        if (!codeValue) {
          const start = node.getStart(sf), end = node.getEnd();
          const raw = src.slice(start, end);
          const fixed = US.reduce((acc, [re, f]) => acc.replace(re, f), raw);
          if (fixed !== raw) edits.push([start, end, fixed]);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    if (!edits.length) continue;
    let out = src;
    for (const [s, e, t] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + t + out.slice(e);
    fs.writeFileSync(file, out); n += edits.length;
    console.error(`written ${file} (${edits.length})`);
  }
  console.error(`${n} literals rewritten`);
}
