// HTML minifier extracted unchanged from the Code Minifier page (29/09); it
// keeps <pre>, <textarea>, <script> and <style> contents intact.

// Elements whose content must be copied through byte-for-byte: <script> and
// <style> can contain whitespace that's semantically meaningful (a multi-line
// template literal, a quoted CSS string with repeated spaces), and <pre>/
// <textarea> render whitespace exactly as written.
const HTML_RAW_TAGS = new Set(['script', 'style', 'pre', 'textarea']);

// Finds a raw-text element's matching closing tag (case-insensitive), e.g.
// the real </script> for a <script> opened earlier — not just the next
// occurrence of '<' followed by those letters, which could appear inside the
// element's own text content in a way that isn't actually a tag.
function findRawTagEnd(input, contentStart, tagName) {
  const lower = input.toLowerCase();
  const needle = '</' + tagName;
  let idx = lower.indexOf(needle, contentStart);
  while (idx !== -1) {
    const after = lower[idx + needle.length];
    if (after === undefined || after === '>' || after === '/' || /\s/.test(after)) {
      let tagEnd = input.indexOf('>', idx);
      tagEnd = tagEnd === -1 ? input.length : tagEnd + 1;
      return { contentEnd: idx, tagEnd };
    }
    idx = lower.indexOf(needle, idx + needle.length);
  }
  return null;
}

// Strips real HTML comments and collapses whitespace with a state-machine
// scanner, rather than a text-blind regex. A naive
// `/<!--[\s\S]*?-->/g` doesn't know it's inside a tag's attribute value, so
// an attribute containing '<!--' or '-->' can make it start or end a "comment"
// match in the wrong place and delete real, visible content between them.
// Here, an entire tag (including quoted attribute values) is consumed
// atomically by a quote-aware scan before control returns to the top-level
// loop, so nothing inside a tag is ever mistaken for a comment delimiter.
// <script>, <style>, <pre>, and <textarea> content is likewise copied
// through untouched rather than whitespace-collapsed.
function minifyHtml(input) {
  let out = '';
  let i = 0;
  const n = input.length;
  let pendingSpace = false;

  while (i < n) {
    const c = input[i];

    if (/\s/.test(c)) {
      pendingSpace = true;
      i++;
      continue;
    }

    if (c === '<' && input[i + 1] === '!' && input[i + 2] === '-' && input[i + 3] === '-') {
      const end = input.indexOf('-->', i + 4);
      if (end !== -1) {
        i = end + 3;
        continue;
      }
      // Unterminated comment: fall through to the generic '<' handling below,
      // same as a plain regex would leave an unmatchable '<!--' untouched.
    }

    const nextChar = input[i + 1];
    const isTagStart = c === '<' && nextChar !== undefined
      && (/[a-zA-Z]/.test(nextChar) || nextChar === '/' || nextChar === '!' || nextChar === '?');

    if (!isTagStart) {
      if (pendingSpace) { if (!(c === '<' && out.endsWith('>'))) out += ' '; pendingSpace = false; }
      out += c;
      i++;
      continue;
    }

    if (pendingSpace) { if (!out.endsWith('>')) out += ' '; pendingSpace = false; }

    const isClose = nextChar === '/';
    const nameStart = isClose ? i + 2 : i + 1;
    let j = nameStart;
    while (j < n && /[a-zA-Z0-9-]/.test(input[j])) j++;
    const tagName = input.slice(nameStart, j).toLowerCase();

    // Scan to this tag's own unquoted '>' so a quoted attribute value can
    // contain '<', '>', '<!--', or '-->' without ever being mistaken for
    // markup structure.
    let k = i + 1;
    let quote = null;
    while (k < n) {
      const ch = input[k];
      if (quote) {
        if (ch === quote) quote = null;
        k++;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; k++; continue; }
      if (ch === '>') { k++; break; }
      k++;
    }

    out += input.slice(i, k).replace(/\s+/g, ' ');
    i = k;

    if (!isClose && HTML_RAW_TAGS.has(tagName)) {
      const found = findRawTagEnd(input, i, tagName);
      if (found) {
        out += input.slice(i, found.tagEnd);
        i = found.tagEnd;
      } else {
        out += input.slice(i);
        i = n;
      }
    }
  }

  return out.trim();
}

export { minifyHtml as minify };
