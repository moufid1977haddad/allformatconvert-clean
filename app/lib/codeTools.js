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

export async function typescriptToJs(code, { jsx = false } = {}) {
  const { transform } = await import('sucrase');
  return transform(code, { transforms: jsx ? ['typescript', 'jsx'] : ['typescript'], disableESTransforms: true, keepUnusedImports: false, jsxRuntime: 'preserve' }).code; // P24: type-only imports removed as tsc does (they failed at load time in ESM); React, side-effect and used imports stay
}

export async function scssToCss(code, { syntax = 'scss', style = 'expanded' } = {}) {
  const sass = await import('sass');
  return sass.compileString(code, { syntax, style }).css;
}

export async function markdownToHtml(md) {
  const { marked } = await import('marked');
  return marked.parse(md, { gfm: true, async: false });
}
