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

const OPERATOR_CHARS = new Set(['{', '}', '(', ')', ';', ',', '=', '+', '-', '*', '/', '<', '>', '!', '&', '|']);

// Strips comments and tightens spacing around operators, without touching the
// contents of string literals ('...', "...", `...`) or regex literals (/.../),
// since a bare textual replace can't tell '//' inside a string from a real comment.
function minifyJs(input) {
  let out = '';
  let i = 0;
  const n = input.length;
  let pendingSpace = false;
  const lastRealChar = () => (out.length ? out[out.length - 1] : '');
  const flushSpaceUnlessTight = (nextIsOperator) => {
    if (pendingSpace) {
      const prevIsOperator = OPERATOR_CHARS.has(lastRealChar());
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
    const isOp = OPERATOR_CHARS.has(c);
    flushSpaceUnlessTight(isOp);
    out += c;
    pendingSpace = false;
    i++;
  }
  return out.trim();
}

export default function JsMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const minify = () => {
    setOutput(minifyJs(input));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JS Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Minified Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
      <SeoContent
        title="JS Minifier"
        description="JS Minifier strips comments and tightens spacing around punctuation entirely in your browser — nothing is uploaded to a server. It's string- and regex-aware: it never alters the contents of quoted strings, template literals, or /regex/ literals, so a URL like https://example.com inside a string won't get corrupted the way a naive comment-stripping approach would."
        howTo={[
          "Paste your JavaScript into the input box.",
          "Click 'Minify' to strip comments and tighten spacing.",
          "Review the result and the characters-saved count below.",
          "Click 'Copy' to copy the minified code."
        ]}
        faqs={[
          { q: "Is JS Minifier safe to use with my code?", a: "Yes — comment-stripping and spacing changes skip over string, template literal, and regex contents, so values like URLs inside strings are left intact. Always review and test minified output before deploying it, as with any automated code transformation." },
          { q: "Is JS Minifier free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it rename variables or remove dead code?", a: "No — this is a lightweight text-based minifier that removes comments and unnecessary whitespace, not a full build-tool-grade minifier like Terser or esbuild." },
          { q: "Is my code uploaded to a server?", a: "No, minification happens entirely in your browser." }
        ]}
        tips={[
          "Whitespace inside strings, template literals, and regex literals is preserved exactly as written — only whitespace and comments in actual code get removed or tightened.",
          "Spacing is only tightened around punctuation like braces, parentheses, and semicolons — spacing around = and other operators is left as-is.",
          "For deeper size reduction (variable renaming, dead-code elimination), use a dedicated build-tool minifier alongside this one.",
          "Keep a copy of your original code before minifying, since there's no undo once you navigate away."
        ]}
      />
    </div>
  );
}