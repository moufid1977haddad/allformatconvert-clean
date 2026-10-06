// The message shown for invalid XML (P37, 06/10). fast-xml-parser's XMLValidator gives err.msg plus err.line and
// err.col; the page showed only msg, so "char '&' is not expected." did not say where. The position is added after it,
// as xmllint and the browsers' own XML parser give one. Returns '' for valid XML (validate() === true).
export function xmlErrorMessage(validation) {
  if (validation === true) return '';
  const err = validation && validation.err;
  if (!err) return 'Invalid XML';
  const where = err.line ? ` (line ${err.line}${err.col ? `, column ${err.col}` : ''})` : '';
  return (err.msg || 'Invalid XML') + where;
}

// One root element (P37 suites, 06/10). fast-xml-parser 5.11.1's validator returns true for <a></a><c/>, <a/><b/>,
// <a/>text and <a/><![CDATA[x]]>: it notes the end of the root only on a closing tag, and checks for a second root
// only on a paired start tag. Such input is not well-formed XML (one document element); Chromium's DOMParser and
// xmllint (libxml2) answer "Extra content at the end of the document" at the '<' of the second root, expat "junk after
// document element". validateXml runs the validator, then this check when it passed (or when it found the second root
// itself, so every case gets the same message and the position of the '<').
const SECOND_ROOT = 'Multiple possible root nodes found.';
export function validateXml(validate, xml) {
  const v = validate(xml);
  if (v !== true && !(v && v.err && v.err.msg === SECOND_ROOT)) return v;
  const r = checkSingleRoot(xml);
  return r === true ? v : r;
}

// Same position rule as the validator: 1-based line and column, BOM removed first.
function position(s, i) {
  const lines = s.substring(0, i).split(/\r?\n/);
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}
function fail(s, i, msg) {
  return { err: { code: 'InvalidXml', msg, ...position(s, i) } };
}

// Scans text that the validator accepted (tags balanced and named): walks the markup at depth 0 and reports the first
// element or text that follows the closed root. Comments, processing instructions, the DOCTYPE and whitespace may
// follow the root. Returns true or a validator-shaped { err }.
export function checkSingleRoot(xml) {
  const s = xml[0] === '\ufeff' ? xml.slice(1) : xml;
  let depth = 0;
  let root = '';
  let i = 0;
  const skipTo = (from, end) => { const j = s.indexOf(end, from); return j === -1 ? s.length : j + end.length; };
  while (i < s.length) {
    const c = s[i];
    if (c !== '<') {
      if (depth === 0 && root && !/\s/.test(c)) return fail(s, i, `Extra content at the end of the document: text after the root element <${root}>.`);
      i++;
      continue;
    }
    if (s.startsWith('<!--', i)) { i = skipTo(i + 4, '-->'); continue; }
    if (s.startsWith('<![CDATA[', i)) {
      if (depth === 0 && root) return fail(s, i, `Extra content at the end of the document: text after the root element <${root}>.`);
      i = skipTo(i + 9, ']]>');
      continue;
    }
    if (s.startsWith('<?', i)) { i = skipTo(i + 2, '?>'); continue; }
    if (s.startsWith('<!', i)) { // DOCTYPE: '>' inside quotes or the internal subset [...] does not end it
      let j = i + 2, brackets = 0, quote = '';
      for (; j < s.length; j++) {
        const d = s[j];
        if (quote) { if (d === quote) quote = ''; }
        else if (d === '"' || d === "'") quote = d;
        else if (d === '[') brackets++;
        else if (d === ']') brackets--;
        else if (d === '>' && brackets <= 0) break;
      }
      i = j + 1;
      continue;
    }
    // A start or end tag: read to its '>', ignoring any '>' inside a quoted attribute value.
    let j = i + 1, quote = '';
    for (; j < s.length; j++) {
      const d = s[j];
      if (quote) { if (d === quote) quote = ''; }
      else if (d === '"' || d === "'") quote = d;
      else if (d === '>') break;
    }
    const inner = s.slice(i + 1, j);
    if (inner[0] === '/') {
      depth--;
    } else {
      const name = inner.match(/^[^\s/>]+/)?.[0] || '';
      if (depth === 0) {
        if (root) return fail(s, i, `Extra content at the end of the document: a second root element <${name}> after <${root}>; XML allows only one root element.`);
        root = name;
      }
      if (inner[inner.length - 1] !== '/') depth++;
    }
    i = j + 1;
  }
  return true;
}
