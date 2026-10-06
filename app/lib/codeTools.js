// Code minify / format / convert helpers for the developer tools (29/09).
//
// Measured before (scripts/converter-tests/05-code-tools.mjs replays it):
// the three hand-written JavaScript minifiers joined lines without inserting
// semicolons, so ordinary code without semicolons broke ("let a = 1\nlet b = 2"
// became "let a=1 let b=2", a syntax error), "return\n42" started returning 42,
// and "a - -b" became "a--b". The SQL formatter inserted line breaks inside
// "-- comments" (turning the rest of the comment into code), the CSS formatter
// split url(data:...;base64,...) values, "TypeScript to JS" removed ": 1" from
// object literals ({a: 1} -> {a}), "SCSS to CSS" did not compile variables,
// nesting or mixins, the diff compared lines by position (one inserted line
// marked everything after it as changed), and "Markdown to HTML" handled six
// patterns. None of them said anything.
//
// Each now uses the engine the reference sites use, loaded only when the
// visitor clicks: terser (JS minify), js-beautify (beautifier.io), csso,
// sql-formatter, jsdiff (Myers algorithm, as diffchecker and git), sucrase
// (TypeScript type stripping), Dart Sass (the reference Sass compiler), marked.

export async function minifyJs(code, { module = false } = {}) {
  const { minify } = await import('terser');
  const res = await minify(code, { module, compress: true, mangle: true, format: { comments: false } });
  return res.code ?? '';
}

export async function minifyCss(code) {
  const { minify } = await import('csso');
  return minify(code).css;
}

export async function beautify(code, lang) {
  const mod = await import('js-beautify');
  const b = mod.default || mod;
  const opts = { indent_size: 2, end_with_newline: false, preserve_newlines: true, max_preserve_newlines: 2 };
  if (lang === 'css') return b.css(code, opts);
  if (lang === 'html') return b.html(code, { ...opts, wrap_line_length: 0, indent_inner_html: true });
  return b.js(code, opts);
}

export async function formatSql(sql, { language = 'sql', keywordCase = 'upper' } = {}) {
  const { format } = await import('sql-formatter');
  return format(sql, { language, keywordCase, tabWidth: 2 });
}

// Line diff (Myers). Returns [{ type: 'same'|'added'|'removed', line, oldNum, newNum }].
// P24 review (03/10): the lines are compared in a normalised form and shown as written. jsdiff's own ignoreWhitespace only
// ignores spaces at the ends of a line (a doubled space inside counted as a change, against the pages' "Ignore whitespace"),
// and an unchanged line showed the new version's text under the old line number when Ignore case was on.
export async function diffLines(a, b, { ignoreWhitespace = false, ignoreCase = false } = {}) {
  const { diffArrays } = await import('diff');
  const split = (s) => { const t = s.replace(/\r\n?/g, '\n'); return t === '' ? [] : t.replace(/\n$/, '').split('\n'); };
  const A = split(a), B = split(b);
  const key = (l) => { let k = ignoreWhitespace ? l.trim().replace(/\s+/g, ' ') : l; if (ignoreCase) k = k.toLowerCase(); return k; };
  const parts = diffArrays(A.map(key), B.map(key));
  const out = [];
  let o = 1;
  let n = 1;
  for (const p of parts) {
    for (let k = 0; k < p.count; k++) {
      if (p.added) { out.push({ type: 'added', line: B[n - 1], newNum: n }); n++; }
      else if (p.removed) { out.push({ type: 'removed', line: A[o - 1], oldNum: o }); o++; }
      else { out.push({ type: 'same', line: A[o - 1], newLine: B[n - 1], oldNum: o, newNum: n }); o++; n++; }
    }
  }
  return out;
}

// TypeScript to JavaScript (P37 suites): the same code as the TypeScript to JS page (app/lib/typescriptToJs.js), so
// JSX is found wherever it is written and a namespace holding code stops the conversion with a message naming it,
// instead of being removed with that code. Type-only imports are removed as tsc does (P24).
export async function typescriptToJs(code) {
  const { convertTypescript } = await import('./typescriptToJs.js');
  return convertTypescript(code);
}

// Code Minifier, TS mode: types removed as above, then Terser. Terser reads JavaScript only, so JSX that
// convertTypescript kept (TSX) cannot be minified; that case gets a message saying so instead of Terser's
// "Unexpected token". The code was TSX when Sucrase's plain TypeScript reading refuses it but the TSX reading worked.
export async function minifyTypescript(code) {
  const js = await typescriptToJs(code);
  try {
    return await minifyJs(js);
  } catch (e) {
    const { transform } = await import('sucrase/dist/index.js');
    let tsx = false;
    try { transform(code, { transforms: ['typescript'], disableESTransforms: true }); } catch { tsx = true; }
    if (tsx) throw new Error('This code contains JSX (TSX). The types were removed, but Terser minifies plain JavaScript only and cannot read JSX. Compile the JSX in your build first, or use TypeScript to JS to remove the types only.');
    throw e;
  }
}

export async function scssToCss(code, { syntax = 'scss', style = 'expanded' } = {}) {
  const sass = await import('sass');
  return sass.compileString(code, { syntax, style }).css;
}

export async function markdownToHtml(md) {
  const { marked } = await import('marked');
  return marked.parse(md, { gfm: true, async: false });
}
