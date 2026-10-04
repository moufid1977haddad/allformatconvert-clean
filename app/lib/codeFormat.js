// Code Formatter engine (P31, 03/10).
//
// Measured on the owner's iPhone (P31 point 5): the tool offered only JSON, CSS and HTML, JSON selected by default, and
// JavaScript pasted into it answered "Error: JSON Parse error: Unexpected identifier" — Safari's raw JSON.parse text,
// no position, no hint that the language was the problem.
//
// Now: the language is detected from the text (a manual choice overrides it), each language uses the formatter the
// reference sites use, loaded only when the visitor clicks Format (prettier/standalone and the one plugin the language
// needs, @prettier/plugin-xml, sql-formatter), and a syntax error is shown as "Line 3, column 12: Unexpected token"
// with the lines around it — never an engine's raw string. JSON keeps the lossless re-indenter (app/lib/jsonText.js):
// a 20-digit id or 1.10 is written exactly as typed.

import { reformatJson, jsonErrorPosition } from './jsonText.js';
import { stripBom } from './jsonLossless.js';

/** The languages offered, in the order of the Language list. ext = the downloaded file's extension. */
export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'jsx', label: 'JSX (React)', ext: 'jsx' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'xml', label: 'XML', ext: 'xml' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'scss', label: 'SCSS', ext: 'scss' },
  { id: 'less', label: 'LESS', ext: 'less' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'yaml', label: 'YAML', ext: 'yaml' },
  { id: 'markdown', label: 'Markdown', ext: 'md' },
  { id: 'graphql', label: 'GraphQL', ext: 'graphql' },
];
export const languageById = (id) => LANGUAGES.find((l) => l.id === id) || null;

/** sql-formatter's dialects (its `language` option), standard SQL first. */
export const SQL_DIALECTS = [
  { id: 'sql', label: 'Standard SQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'transactsql', label: 'SQL Server (T-SQL)' },
  { id: 'plsql', label: 'Oracle (PL/SQL)' },
  { id: 'bigquery', label: 'BigQuery' },
  { id: 'snowflake', label: 'Snowflake' },
  { id: 'redshift', label: 'Amazon Redshift' },
  { id: 'clickhouse', label: 'ClickHouse' },
  { id: 'duckdb', label: 'DuckDB' },
  { id: 'trino', label: 'Trino / Presto' },
  { id: 'spark', label: 'Spark SQL' },
  { id: 'hive', label: 'Hive' },
  { id: 'db2', label: 'IBM Db2' },
  { id: 'db2i', label: 'IBM Db2 for i' },
  { id: 'singlestoredb', label: 'SingleStore' },
  { id: 'tidb', label: 'TiDB' },
  { id: 'n1ql', label: 'N1QL (Couchbase)' },
];

// ---- detection --------------------------------------------------------------------------------------------------

const HTML_TAGS = /<(!doctype\s+html|html|head|body|div|span|p|a|ul|ol|li|table|tr|td|th|thead|tbody|form|input|button|label|select|option|textarea|img|br|hr|h[1-6]|section|article|nav|header|footer|main|aside|meta|link|script|style|title|iframe|video|audio|canvas|svg|strong|em|b|i|small|pre|code|blockquote)\b/i;
const JS_WORDS = /(^|[^\w$.])(const|let|var|function|return|import|export|class|async|await|require|module\.exports|console\.\w+|document\.|window\.|new\s+[A-Z]\w*|if\s*\(|for\s*\(|while\s*\()(?![\w$])|=>/;
const TS_MARKS = [
  /(^|[\s;{(,])(interface|type)\s+[A-Z]\w*\s*(<[^>]*>\s*)?(=|\{|extends)/,
  /[\w)\]?]\s*:\s*(string|number|boolean|any|unknown|void|never|bigint|object|null|undefined)(\[\])?\s*[,;)=|{}>]/,
  /(^|\s)(enum|namespace|declare|abstract)\s+\w+/,
  /\b(public|private|protected|readonly)\s+\w+\s*[:(=;]/,
  /\bimport\s+type\b|\bexport\s+type\b/,
  /\bas\s+(const|string|number|any|unknown)\b/,
  /\w+\s*<\s*[A-Z]\w*(\s*,\s*[A-Z]\w*)*\s*>\s*\(/,
  /\)\s*:\s*[A-Z]\w*(<[^>]*>)?(\[\])?\s*(=>|\{)/,
];
const SQL_START = /^(select|insert|update|delete|create|alter|drop|with|merge|truncate|grant|revoke|explain|replace|upsert|declare|begin|use|show|set)\b/i;
const SQL_SECOND = /\b(from|into|table|where|values|set|join|view|index|database|schema|as|grant|on|procedure|function|trigger|returns?|union|order\s+by|group\s+by|limit)\b/i;
const GQL_OP = /^(query|mutation|subscription|fragment)\b[^{]*\{/;
const GQL_SDL = /^(type|input|enum|interface|union|scalar|schema|directive|extend)\b/;
const YAML_LINE = /^\s*(-\s+\S|-\s*$|[\w"'$./@-][^:#{}\[\],]*:(\s|$)|#|---\s*$|\.\.\.\s*$)/;

/**
 * The language a text most likely is, or null when nothing fits. Plain rules on the text (no engine is loaded):
 * the first characters (<, {, [, a SQL or GraphQL keyword), then marks only one language has.
 */
export function detectLanguage(raw) {
  const text = stripBom(String(raw || '')).trim();
  if (!text) return null;
  const head = text.slice(0, 4000);
  const lines = head.split(/\r?\n/).filter((l) => l.trim());

  // Markup.
  if (/^<\?xml\b/i.test(head)) return 'xml';
  if (head[0] === '<') {
    if (/^<!doctype\s+html/i.test(head) || HTML_TAGS.test(head.slice(0, 400))) return 'html';
    if (/^<[A-Za-z][\w:.-]*[\s>/]/.test(head) || /^<!--/.test(head)) return 'xml';
  }

  // GraphQL: an operation, a selection set ({ user { id } }) or a schema definition.
  if (GQL_OP.test(head) || /^\{\s*[A-Za-z_]\w*\s*(\([^)]*\)\s*)?\{/.test(head)) return 'graphql';
  if (GQL_SDL.test(head) && /\{[^}]*\}/.test(head) && !/[;=]|:\s*(string|number|boolean)\b/.test(head)) return 'graphql';

  // JSON: starts and ends like a JSON value, holds no JavaScript.
  if (/^[[{]/.test(head) && /[\]}]$/.test(text) && !JS_WORDS.test(head)) {
    try { JSON.parse(text); return 'json'; } catch { /* broken JSON or a JS literal */ }
    if (/^[[{]\s*("|\[|\{|\]|\}|-?\d|true\b|false\b|null\b)/.test(head)) return 'json'; // a JSON with a mistake: say where
  }

  // SQL: a statement keyword followed by a second one (SELECT … FROM, CREATE TABLE, UPDATE … SET).
  if (SQL_START.test(head.replace(/^(\s*(--[^\n]*|\/\*[\s\S]*?\*\/))+\s*/, '')) && SQL_SECOND.test(head) && !JS_WORDS.test(head.replace(/'[^']*'/g, ''))) return 'sql';

  // JavaScript family.
  const looksTs = TS_MARKS.some((r) => r.test(head));
  const hasJsx = /<([A-Z][\w.]*|[a-z]+)(\s+[\w-]+(=("[^"]*"|\{[^}]*\}))?)*\s*\/?>/.test(head) && /(return\s*\(?\s*<|=>\s*\(?\s*<|=\s*\(?\s*<[A-Za-z]|className=|\{\s*\w+[\w.]*\s*\}\s*<\/)/.test(head);
  if (looksTs) return 'typescript';
  if (hasJsx) return 'jsx';
  if (JS_WORDS.test(head)) return 'javascript';

  // Style sheets: a selector followed by a { … : … } block, or an at-rule.
  const cssBlock = /(^|[}\s;])[^{};]+\{[^{}]*:[^{}]*\}?/.test(head) || /^@(media|import|font-face|keyframes|charset|supports)\b/m.test(head);
  if (cssBlock || /^\s*[$@][\w-]+\s*:/m.test(head)) {
    if (/^\s*@[\w-]+\s*:/m.test(head) && !/^\s*@(media|import|charset|font-face|keyframes|supports|page|namespace)\b/m.test(head.replace(/^\s*@[\w-]+\s*:.*$/gm, '')) && !/\$[\w-]+\s*:/.test(head)) return 'less';
    if (/\.[\w-]+\([^)]*\)\s*;|when\s*\(|~["']|@\{[\w-]+\}/.test(head)) return 'less';
    if (/\$[\w-]+\s*:|@(mixin|include|use|forward|extend|each|if|function|return)\b|#\{|(^|\s)&[\w:.-]|\/\/ /.test(head)) return 'scss';
    if (/(^|[};])\s*[^@\s{};][^{};]*\{[^{}]*\{/.test(head)) return 'scss'; // a rule inside a rule (not in @media) // nesting: Sass/LESS syntax, SCSS is the common one
    if (cssBlock) return 'css';
  }

  // Markdown vs YAML: YAML is mostly key: value / - item lines; Markdown has headings, emphasis, links, fences.
  const yamlShare = lines.filter((l) => YAML_LINE.test(l)).length / lines.length;
  const mdMarks = (/^#{1,6}\s+\S/m.test(head) ? 1 : 0) + (/\[[^\]]+\]\([^)]+\)/.test(head) ? 1 : 0) + (/^```/m.test(head) ? 1 : 0)
    + (/\*\*[^*\n]+\*\*|__[^_\n]+__/.test(head) ? 1 : 0) + (/^\s*>\s/m.test(head) ? 1 : 0) + (/^\s*\d+\.\s+\S/m.test(head) ? 1 : 0)
    + (/^\|.*\|\s*$/m.test(head) ? 1 : 0);
  const keyLines = lines.filter((l) => /^\s*[\w"'$./@-][^:#{}\[\],]*:(\s|$)/.test(l)).length;
  if (keyLines > 0 && yamlShare >= 0.8 && mdMarks <= 1) return 'yaml';
  if (/^---\s*$/m.test(lines[0] || '') && yamlShare >= 0.8) return 'yaml';
  if (mdMarks >= 1 || /^\s*[-*+]\s+\S/m.test(head)) return 'markdown';
  return null;
}

// ---- formatting -------------------------------------------------------------------------------------------------

/** Thrown for a syntax error: { line, column, message } is what the page shows ("Line 3, column 12: …"). */
export class CodeSyntaxError extends Error {
  constructor(message, line, column, text) {
    super(message);
    this.name = 'CodeSyntaxError';
    this.line = line;
    this.column = column;
    this.frame = line ? codeFrame(text, line, column) : '';
  }
}

/** The lines around an error, with a caret under the column (what Prettier's playground and babel show). */
export function codeFrame(text, line, column) {
  const all = String(text).split(/\r\n|\r|\n/);
  const from = Math.max(1, line - 2), to = Math.min(all.length, line + 1), w = String(to).length;
  const out = [];
  for (let n = from; n <= to; n++) {
    let src = all[n - 1] ?? '';
    let col = column || 1;
    if (src.length > 120) { const start = n === line ? Math.max(0, col - 60) : 0; src = (start ? '…' : '') + src.slice(start, start + 120); if (n === line && start) col = col - start + 1; }
    out.push(`${n === line ? '>' : ' '} ${String(n).padStart(w)} | ${src}`);
    if (n === line && column) out.push(`  ${' '.repeat(w)} | ${src.slice(0, col - 1).replace(/[^\t]/g, ' ')}^`);
  }
  return out.join('\n');
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Prettier's message: "CssSyntaxError: Unclosed block (3:3)\n  1 | …code frame…". Keep the words only.
function prettierMessage(e) {
  let m = String(e.message || '').split('\n')[0];
  m = m.replace(/\s*\(\d+:\d+\)\s*$/, '').replace(/^(CssSyntaxError|SyntaxError|Syntax Error|Error):\s*/i, '')
    .replace(/\s*For more info see \S+/i, '').replace(/\s+/g, ' ').trim();
  return cap(m) || 'Syntax error';
}

let prettierP = null;
const loadPrettier = () => (prettierP ||= import('prettier/standalone'));
const PLUGINS = {
  babel: () => import('prettier/plugins/babel'),
  estree: () => import('prettier/plugins/estree'),
  typescript: () => import('prettier/plugins/typescript'),
  postcss: () => import('prettier/plugins/postcss'),
  html: () => import('prettier/plugins/html'),
  yaml: () => import('prettier/plugins/yaml'),
  markdown: () => import('prettier/plugins/markdown'),
  graphql: () => import('prettier/plugins/graphql'),
  xml: () => import('@prettier/plugin-xml'),
};
const PRETTIER = {
  javascript: { parser: 'babel', plugins: ['babel', 'estree'] },
  jsx: { parser: 'babel', plugins: ['babel', 'estree'] },
  typescript: { parser: 'typescript', plugins: ['typescript', 'estree'] },
  css: { parser: 'css', plugins: ['postcss'] },
  scss: { parser: 'scss', plugins: ['postcss'] },
  less: { parser: 'less', plugins: ['postcss'] },
  html: { parser: 'html', plugins: ['html', 'postcss', 'babel', 'estree'] }, // <style> and <script> formatted too
  yaml: { parser: 'yaml', plugins: ['yaml'] },
  markdown: { parser: 'markdown', plugins: ['markdown'] },
  graphql: { parser: 'graphql', plugins: ['graphql'] },
  xml: { parser: 'xml', plugins: ['xml'], options: { xmlWhitespaceSensitivity: 'preserve' } }, // text content kept as written
};

// XML: @prettier/plugin-xml re-indents <b>hi</c> without a word (measured), so well-formedness is checked first by
// the browser's own XML parser. Its message is engine text; only the line, the column and the reason are kept.
function checkXml(text) {
  if (typeof DOMParser === 'undefined') return;
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (!err) return;
  const msg = err.textContent || '';
  let m = /line (\d+) at column (\d+):\s*([^\n]+)/i.exec(msg); // Chromium, WebKit
  if (m) throw new CodeSyntaxError(cap(m[3].trim().replace(/\s+/g, ' ')), +m[1], +m[2], text);
  m = /XML Parsing Error:\s*([^\n]+)[\s\S]*?Line Number (\d+), Column (\d+)/i.exec(msg); // Firefox
  if (m) throw new CodeSyntaxError(cap(m[1].trim()), +m[2], +m[3], text);
  throw new CodeSyntaxError('This XML is not well-formed', 0, 0, text);
}

function jsonError(text) {
  const pos = jsonErrorPosition(text);
  if (!pos) return null;
  const c = text[pos.offset];
  let msg;
  if (c === undefined) msg = 'Unexpected end of input — a closing bracket, brace or quote is missing';
  else if (c === "'") msg = 'Unexpected character "\'" — JSON strings and keys need double quotes';
  else if (/[A-Za-z_$]/.test(c) && /[{,]\s*$/.test(text.slice(0, pos.offset))) msg = `Unexpected character "${c}" — JSON keys need double quotes`;
  else if ((c === '}' || c === ']') && /,\s*$/.test(text.slice(0, pos.offset))) msg = `Unexpected "${c}" — JSON allows no comma before it`;
  else if (c === '/') msg = 'Unexpected "/" — JSON allows no comments';
  else msg = `Unexpected character "${c}"`;
  if (JS_WORDS.test(text)) msg += '. This looks like JavaScript, not JSON: choose JavaScript or Auto-detect in the Language list';
  return new CodeSyntaxError(msg, pos.line, pos.column, text);
}

function sqlError(e, text) {
  const raw = String(e && e.message || '');
  const m = /at line (\d+) column (\d+)/i.exec(raw);
  if (!m) return null;
  let msg;
  const u = /Unexpected "([^"]*)"/.exec(raw);
  if (/«EOF»/.test(raw)) msg = 'Unexpected end of the query — a closing parenthesis, quote or keyword is missing';
  else if (u && /^['"`]/.test(u[1])) msg = `Unclosed quote: the string starting with ${u[1][0]} has no closing ${u[1][0]}`;
  else if (u) msg = `Unexpected "${u[1].trim()}"`;
  else msg = cap(raw.split('\n')[0].replace(/\s*at line \d+ column \d+\.?/i, '').replace(/^Parse error:?\s*/i, '')) || 'Syntax error';
  return new CodeSyntaxError(msg, +m[1], +m[2], text);
}

/**
 * Formats text as lang. Returns the formatted text; throws CodeSyntaxError for a syntax error (line/column/frame) and
 * any other error as is (a chunk that failed to load, for instance).
 * @param {string} text
 * @param {string} lang one of LANGUAGES' ids
 * @param {{ sqlDialect?: string }} [opts]
 */
export async function formatCode(text, lang, { sqlDialect = 'sql' } = {}) {
  const src = stripBom(String(text));
  if (lang === 'json') {
    try { return reformatJson(src, 2); } catch (e) { throw jsonError(src) || e; }
  }
  if (lang === 'sql') {
    const { format } = await import('sql-formatter');
    try { return format(src, { language: sqlDialect, keywordCase: 'upper', tabWidth: 2 }); } catch (e) { throw sqlError(e, src) || e; }
  }
  const conf = PRETTIER[lang];
  if (!conf) throw new Error(`Unknown language: ${lang}`);
  if (lang === 'xml') checkXml(src);
  const [prettier, ...plugins] = await Promise.all([loadPrettier(), ...conf.plugins.map((p) => PLUGINS[p]())]);
  try {
    return await prettier.format(src, { parser: conf.parser, plugins: plugins.map((m) => m.default || m), printWidth: 80, tabWidth: 2, ...conf.options });
  } catch (e) {
    const loc = e && e.loc && e.loc.start;
    if (loc && loc.line) throw new CodeSyntaxError(prettierMessage(e), loc.line, loc.column, src);
    if (e instanceof SyntaxError) throw new CodeSyntaxError(prettierMessage(e), 0, 0, src);
    throw e;
  }
}

/** The text shown for an error: "Line 3, column 12: Unexpected token" and the lines around it. */
export function errorText(e) {
  if (e instanceof CodeSyntaxError || (e && e.name === 'CodeSyntaxError')) {
    const where = e.line ? `Line ${e.line}${e.column ? `, column ${e.column}` : ''}: ` : '';
    return where + e.message + (e.frame ? '\n\n' + e.frame : '');
  }
  return (e && e.message) ? e.message : String(e);
}
