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
  return /[([{,;:=!&|?+\-*%^~<>]/.test(ch);
}

// Adds line breaks/indentation around { [ } ] ; , without touching the contents
// of string/template literals, regex literals, or comments — a bare per-character
// scan can't tell a comma inside a string from a real statement separator.
function formatJs(input) {
  let out = '';
  let indent = 0;
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    const c2 = input[i + 1];
    if (c === '/' && c2 === '/') {
      const start = i;
      while (i < n && input[i] !== '\n') i++;
      out += input.slice(start, i);
      continue;
    }
    if (c === '/' && c2 === '*') {
      const start = i;
      i += 2;
      while (i < n && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      out += input.slice(start, i);
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const start = i;
      const quote = c;
      i++;
      while (i < n) {
        if (input[i] === '\\') { i += 2; continue; }
        if (input[i] === quote) { i++; break; }
        i++;
      }
      out += input.slice(start, i);
      continue;
    }
    if (c === '/' && looksLikeRegexStart(out)) {
      const start = i;
      i++;
      let inClass = false;
      while (i < n) {
        if (input[i] === '\\') { i += 2; continue; }
        if (input[i] === '[') inClass = true;
        else if (input[i] === ']') inClass = false;
        if (input[i] === '/' && !inClass) { i++; break; }
        if (input[i] === '\n') break;
        i++;
      }
      while (i < n && /[a-z]/i.test(input[i])) i++;
      out += input.slice(start, i);
      continue;
    }
    if (c === '{' || c === '[') {
      indent++;
      out += c + '\n' + '  '.repeat(indent);
      i++;
      continue;
    }
    if (c === '}' || c === ']') {
      indent = Math.max(0, indent - 1);
      out += '\n' + '  '.repeat(indent) + c;
      i++;
      continue;
    }
    if (c === ';' || c === ',') {
      out += c + '\n' + '  '.repeat(indent);
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out.trim();
}

const MINIFY_OPERATOR_CHARS = new Set(['{', '}', '[', ']', '(', ')', ';', ',']);

// Same string/regex/comment-aware scanning as formatJs, but collapsing
// whitespace and tightening spacing around punctuation instead of breaking lines.
function minifyJs(input) {
  let out = '';
  let i = 0;
  const n = input.length;
  let pendingSpace = false;
  const lastRealChar = () => (out.length ? out[out.length - 1] : '');
  const flushSpaceUnlessTight = (nextIsOperator) => {
    if (pendingSpace) {
      const prevIsOperator = MINIFY_OPERATOR_CHARS.has(lastRealChar());
      if (!prevIsOperator && !nextIsOperator) out += ' ';
      pendingSpace = false;
    }
  };
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
      flushSpaceUnlessTight(false);
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
      flushSpaceUnlessTight(false);
      let re = c;
      i++;
      let inClass = false;
      while (i < n) {
        if (input[i] === '\\') { re += input[i] + (input[i + 1] || ''); i += 2; continue; }
        if (input[i] === '[') inClass = true;
        else if (input[i] === ']') inClass = false;
        if (input[i] === '/' && !inClass) { re += input[i]; i++; break; }
        if (input[i] === '\n') break;
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
    const isOp = MINIFY_OPERATOR_CHARS.has(c);
    flushSpaceUnlessTight(isOp);
    out += c;
    pendingSpace = false;
    i++;
  }
  return out.trim();
}

export default function JavascriptFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => setOutput(formatJs(input));
  const minify = () => setOutput(minifyJs(input));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JavaScript Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JavaScript Formatter"
        description="JavaScript Formatter adds line breaks and indentation around braces, brackets, semicolons, and commas entirely in your browser, and its Minify button does the reverse. Both are string- and regex-aware: they never insert line breaks into or alter the contents of quoted strings, template literals, or /regex/ literals, so a comma or semicolon inside a string stays part of that string's value instead of corrupting it."
        howTo={[
          "Paste your JavaScript into the input box.",
          "Click 'Format' to add line breaks and 2-space indentation, or 'Minify' to compress it back down.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is JavaScript Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it support minified code?", a: "Yes — Format expands minified code by breaking lines at braces, brackets, semicolons, and commas, while leaving string and regex contents untouched." },
          { q: "Can I customize indentation size or style?", a: "No, formatting always uses 2-space indentation — there's no configuration for tab size, quote style, or line length." },
          { q: "Is my code uploaded to a server?", a: "No, both formatting and minifying happen entirely in your browser." }
        ]}
        tips={[
          "A comma, semicolon, brace, or bracket inside a string or template literal is treated as plain text, not a structural character — it won't trigger a line break or get compressed away.",
          "Comments are preserved during Format (kept as-is) and stripped during Minify, matching typical formatter/minifier behavior.",
          "This reformats structure only — it doesn't rename variables, reorder code, or fix logic errors.",
          "Review the output before using it in production, as with any automated code transformation."
        ]}
      />
    </div>
  );
}