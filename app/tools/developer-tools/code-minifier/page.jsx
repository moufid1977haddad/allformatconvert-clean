'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Word after which a leading '/' is a regex literal, not a division operator.
const REGEX_CONTEXT_KEYWORDS = /^(return|typeof|instanceof|in|of|new|delete|void|throw|yield|case|do|else)$/;

function looksLikeRegexStart(emittedSoFar) {
  let j = emittedSoFar.length - 1;
  while (j >= 0 && /\s/.test(emittedSoFar[j])) j--;
  if (j < 0) return true; // start of input
  const ch = emittedSoFar[j];
  if (/[\w$]/.test(ch)) {
    let k = j;
    while (k >= 0 && /[\w$]/.test(emittedSoFar[k])) k--;
    return REGEX_CONTEXT_KEYWORDS.test(emittedSoFar.slice(k + 1, j + 1));
  }
  // After an operator/punctuation, '/' starts a regex rather than dividing.
  return /[([{,;:=!&|?+\-*%^~<>]/.test(ch);
}

// Strips // and /* */ comments and collapses whitespace, without touching the
// contents of string literals ('...', "...", `...`) or regex literals (/.../),
// since a bare textual replace can't tell '//' inside a string from a real comment.
function minifyJsLike(input) {
  let out = '';
  let i = 0;
  const n = input.length;
  let pendingSpace = false;
  while (i < n) {
    const c = input[i];
    const c2 = input[i + 1];
    if (c === '/' && c2 === '/') {
      while (i < n && input[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      pendingSpace = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      if (pendingSpace) { out += ' '; pendingSpace = false; }
      const quote = c;
      let str = c;
      i++;
      while (i < n) {
        if (input[i] === '\\') { str += input[i] + (input[i + 1] || ''); i += 2; continue; }
        if (input[i] === quote) { str += input[i]; i++; break; }
        str += input[i]; i++;
      }
      out += str;
      pendingSpace = false;
      continue;
    }
    if (c === '/' && looksLikeRegexStart(out)) {
      if (pendingSpace) { out += ' '; pendingSpace = false; }
      let re = c;
      i++;
      let inClass = false;
      while (i < n) {
        if (input[i] === '\\') { re += input[i] + (input[i + 1] || ''); i += 2; continue; }
        if (input[i] === '[') inClass = true;
        else if (input[i] === ']') inClass = false;
        if (input[i] === '/' && !inClass) { re += input[i]; i++; break; }
        if (input[i] === '\n') break; // unterminated on this line; bail out of regex mode
        re += input[i]; i++;
      }
      while (i < n && /[a-z]/i.test(input[i])) { re += input[i]; i++; }
      out += re;
      pendingSpace = false;
      continue;
    }
    if (/\s/.test(c)) {
      pendingSpace = true;
      i++;
      continue;
    }
    if (pendingSpace) { out += ' '; pendingSpace = false; }
    out += c;
    i++;
  }
  return out.trim();
}

// Same idea for CSS: only '/* */' comments exist, but whitespace/punctuation
// collapsing must skip over quoted string values so e.g. content: "a: b" isn't altered.
function minifyCss(input) {
  const segments = [];
  let i = 0;
  const n = input.length;
  let buf = '';
  while (i < n) {
    const c = input[i];
    if (c === '"' || c === "'") {
      if (buf) { segments.push({ code: buf }); buf = ''; }
      const quote = c;
      let str = c;
      i++;
      while (i < n) {
        if (input[i] === '\\') { str += input[i] + (input[i + 1] || ''); i += 2; continue; }
        if (input[i] === quote) { str += input[i]; i++; break; }
        str += input[i]; i++;
      }
      segments.push({ string: str });
      continue;
    }
    buf += c;
    i++;
  }
  if (buf) segments.push({ code: buf });
  return segments
    .map(seg => seg.string !== undefined
      ? seg.string
      : seg.code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1'))
    .join('')
    .trim();
}

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

export default function CodeMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('js');
  const minify = () => {
    let result = input;
    if (lang === 'js' || lang === 'ts') {
      result = minifyJsLike(result);
    } else if (lang === 'css') {
      result = minifyCss(result);
    } else if (lang === 'html') {
      result = minifyHtml(result);
    }
    setOutput(result);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JS, CSS, HTML and TypeScript</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['js','ts','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
      <SeoContent
        title="Code Minifier"
        description="Code Minifier strips comments and collapses whitespace for JS, TS, CSS, and HTML entirely in your browser — nothing is uploaded to a server. For JS/TS and CSS, it's string-aware: it never touches the contents of quoted strings, template literals, or /regex/ literals, so a URL like https://example.com inside a string or a template literal containing // won't get corrupted. For HTML, it's a tag-aware scanner rather than a plain-text regex: it never mistakes a '<!--' or '-->' inside a quoted attribute value for a real comment delimiter, and it copies the contents of <script>, <style>, <pre>, and <textarea> through completely untouched instead of collapsing their whitespace. This is a lightweight minifier, not a full parser — it doesn't rename variables or eliminate dead code like tools such as Terser."
        howTo={[
          "Choose JS, TS, CSS, or HTML from the language buttons.",
          "Paste your code into the input box.",
          "Click 'Minify' to strip comments and collapse whitespace.",
          "Click 'Copy' to copy the result, or check the characters-saved count below."
        ]}
        faqs={[
          { q: "Is Code Minifier free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will minification break my code?", a: "For JS, TS, and CSS, comment-stripping and whitespace-collapsing skip over string, template literal, and regex contents, so things like URLs inside strings are left intact. For HTML, comment-stripping only recognizes real '<!--' ... '-->' delimiters in actual markup position — an attribute value that happens to contain that text won't be misread as a comment and won't cause real content to be deleted — and <script>, <style>, <pre>, and <textarea> content is preserved exactly as written rather than whitespace-collapsed." },
          { q: "What languages does it support?", a: "JavaScript, TypeScript, CSS, and HTML. There's no JSON-specific mode (use JSON Minifier for that) or support for other languages." },
          { q: "Does it store or upload my code?", a: "No, everything runs locally in your browser; your code is never sent to a server." }
        ]}
        tips={[
          "For JS/TS, whitespace inside strings, template literals, and regex literals is preserved exactly as written — only whitespace and comments in actual code get collapsed or removed.",
          "For CSS, quoted string values (e.g. content: \"a: b\") are left untouched even though spacing and punctuation elsewhere gets tightened.",
          "For HTML, <script>, <style>, <pre>, and <textarea> content is left byte-for-byte untouched — safe for a multi-line template literal, a CSS string with meaningful repeated spaces, or preformatted text.",
          "Keep a copy of your original code before minifying, since there's no undo once you navigate away."
        ]}
      />
    </div>
  );
}