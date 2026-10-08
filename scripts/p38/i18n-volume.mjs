// P38-0: measures the visible English text to translate (characters and words), per tool and for the shared strings.
// Heuristic, read-only: parses every .js/.jsx/.ts/.tsx file with the TypeScript compiler and keeps JSX text, plus
// string/template literals that read as prose (a letter and a space) or sit in a label-like attribute/property.
// Skips imports, className/style/href/src/id/key/type, console.*, Tailwind-like class strings, workers and comments.
// Usage: node scripts/p38/i18n-volume.mjs [--json out.json]
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SKIP_ATTRS = new Set(['className', 'style', 'href', 'src', 'id', 'key', 'type', 'accept', 'rel', 'target', 'role', 'name', 'htmlFor', 'inputMode', 'autoComplete', 'pattern', 'method', 'encType', 'lang', 'dir', 'viewBox', 'd', 'fill', 'stroke', 'xmlns', 'mode', 'as', 'variant', 'size', 'color']);
const LABEL_KEYS = new Set(['title', 'placeholder', 'alt', 'aria-label', 'label', 'q', 'a', 'description', 'value', 'text', 'message', 'hint', 'howToTitle', 'privacy', 'note', 'tip', 'heading', 'subtitle', 'absolute', 'error', 'warning', 'caption', 'tooltip', 'summary']);
const SKIP_CALLS = /^(console\.|require$|import$|cn$|clsx$|classNames$|fetch$|new URL|URL$|querySelector|getElementById|addEventListener|removeEventListener|postMessage|setAttribute|getItem|setItem|removeItem|createElement|RegExp$|match$|replace$|split$|startsWith$|endsWith$|includes$|test$|exec$|indexOf$|padStart$|padEnd$|join$|append$|set$|get$|has$|toLocaleString$|Intl\.)/;

function isClassLike(s) {
  const w = s.trim().split(/\s+/);
  if (w.length < 2) return false;
  const cls = w.filter((x) => /^[!a-z0-9:\-\/\[\].%#_()&>~=,'"]+$/.test(x) && /[-:\[]/.test(x)).length;
  return cls / w.length >= 0.5;
}
function isProse(s) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!/[A-Za-z]/.test(t)) return false;
  if (isClassLike(t)) return false;
  if (/^(https?:|\/|\.\/|data:|blob:|#|@)/.test(t) && !/ /.test(t)) return false;
  if (/^[\w.\-\/]+\.(js|mjs|wasm|json|css|png|svg|jpg|pdf|zip)$/.test(t)) return false;
  return true;
}
function calleeName(n) {
  const e = n.expression;
  return e ? e.getText() : '';
}

function extract(file) {
  const src = fs.readFileSync(file, 'utf8');
  const kind = file.endsWith('x') ? (file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX) : (file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('.js') ? ts.ScriptKind.JSX : kind);
  const out = [];
  const push = (t) => { t = t.replace(/\s+/g, ' ').trim(); if (t) out.push(t); };

  function ctxAllows(node) {
    // Walk up to find the governing attribute / property / call.
    let p = node.parent;
    let depth = 0;
    while (p && depth < 6) {
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return 'skip';
      if (ts.isJsxAttribute(p)) { const n = p.name.getText(); return SKIP_ATTRS.has(n) ? 'skip' : (LABEL_KEYS.has(n) ? 'label' : 'prose'); }
      if (ts.isPropertyAssignment(p)) { const n = p.name.getText().replace(/['"]/g, ''); if (SKIP_ATTRS.has(n) || n === 'className') return 'skip'; if (LABEL_KEYS.has(n)) return 'label'; }
      if (ts.isCallExpression(p) || ts.isNewExpression(p)) { const c = calleeName(p); if (SKIP_CALLS.test(c) || /\.(includes|startsWith|endsWith|replace|split|match|test|querySelector|get|has|set|append|join|indexOf|toLowerCase)$/.test(c)) return 'skip'; return 'prose'; }
      if (ts.isElementAccessExpression(p) || ts.isCaseClause(p)) return 'skip';
      if (ts.isBinaryExpression(p) && /===|!==|==|!=/.test(p.operatorToken.getText())) return 'skip';
      p = p.parent; depth++;
    }
    return 'prose';
  }

  function visit(node) {
    if (ts.isJsxText(node)) { if (/[A-Za-z]/.test(node.text)) push(node.text); return; }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const c = ctxAllows(node);
      if (c === 'skip') return;
      const t = node.text;
      if (c === 'label' ? /[A-Za-z]/.test(t) && !isClassLike(t) : (/ /.test(t.trim()) && isProse(t))) push(t);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const c = ctxAllows(node);
      if (c === 'skip') return;
      const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(' ');
      if (/ /.test(parts.trim()) && isProse(parts)) push(parts);
      node.templateSpans.forEach((s) => visit(s.expression));
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'api' && e.name !== 'node_modules' && e.name !== 'libraw') walk(p, acc); }
    else if (/\.(jsx?|tsx?)$/.test(e.name) && !/\.worker\.js$|\.test\.|\.d\.ts$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = walk(path.join(ROOT, 'app'));
const groups = {};
const add = (g, strings) => { (groups[g] ||= []).push(...strings); };
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const m = rel.match(/^app\/tools\/([^/]+)\/([^/]+)\//);
  let g;
  if (m) g = `tool:/tools/${m[1]}/${m[2]}`;
  else if (/^app\/tools\/[^/]+\/(page|layout)\./.test(rel)) g = `common:category-pages:${rel.split('/')[2]}`;
  else if (/^app\/(about|privacy|terms|contact)\//.test(rel)) g = 'common:legal-about';
  else if (/^app\/(signin|signup|forgot-password|reset-password)\//.test(rel)) g = 'common:account';
  else if (/^app\/components\/(Navbar|Footer|SiteName)/.test(rel)) g = 'common:nav-footer';
  else if (/^app\/(page|HomeClient|layout)\./.test(rel)) g = 'common:home-layout';
  else if (/^app\/components\//.test(rel)) g = 'common:shared-components';
  else if (/^app\/lib\//.test(rel)) g = 'common:shared-lib-messages';
  else g = 'common:other';
  add(g, extract(f));
}
const stat = (arr) => ({ chars: arr.reduce((s, t) => s + t.length, 0), words: arr.reduce((s, t) => s + t.split(/\s+/).length, 0), strings: arr.length });
const rows = Object.entries(groups).map(([g, arr]) => ({ group: g, ...stat(arr), uniq: stat([...new Set(arr)]) }));
const tools = rows.filter((r) => r.group.startsWith('tool:')).sort((a, b) => b.chars - a.chars);
const common = rows.filter((r) => r.group.startsWith('common:'));
const allTool = Object.entries(groups).filter(([g]) => g.startsWith('tool:')).flatMap(([, a]) => a);
const allCommon = Object.entries(groups).filter(([g]) => g.startsWith('common:')).flatMap(([, a]) => a);
const res = { tools, common, totals: { toolCount: tools.length, tools: stat(allTool), toolsUniq: stat([...new Set(allTool)]), common: stat(allCommon), commonUniq: stat([...new Set(allCommon)]), site: stat([...allTool, ...allCommon]), siteUniq: stat([...new Set([...allTool, ...allCommon])]) } };
const j = process.argv.indexOf('--json');
if (j > 0) fs.writeFileSync(process.argv[j + 1], JSON.stringify(res, null, 1));
if (process.argv.includes('--dump')) { const g = process.argv[process.argv.indexOf('--dump') + 1]; console.log(groups[g].join('\n')); process.exit(0); }
console.log(JSON.stringify(res.totals, null, 1));
for (const c of common) console.log(c.group, c.chars, c.words, 'uniq', c.uniq.chars);
console.log('top tools:'); tools.slice(0, 10).forEach((t) => console.log(t.group, t.chars, t.words));
console.log('min tools:'); tools.slice(-5).forEach((t) => console.log(t.group, t.chars, t.words));
