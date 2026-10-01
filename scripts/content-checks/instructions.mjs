// P20 (01/10): every control a tool page's instructions name must exist on that page, with the same label.
//
// For each tool page (app/tools/<category>/<tool>/page.*), the instruction texts are every string under a property or
// JSX attribute named howTo, tips or faqs (SeoContent, seo={{…}} objects, SEO constants). A label the text quotes
// ("Merge PDF", “Copy”) must appear in the rest of the page: its own JSX and strings, the files next to it, and the
// JSX and strings of the local components it imports (two levels). Gesture words are checked against the code too:
// "drag … reorder" needs a draggable list, "arrows" to reorder needs arrow buttons, "slider" needs a range input,
// "checkbox" needs a checkbox, "dropdown" needs a <select> or a listbox, "double-click" needs a double-click handler.
//
// Usage: node scripts/content-checks/instructions.mjs [--verbose]   (exit 1 when something does not match)
// A quoted text that is not a label (an example input, a file name, a value to type) goes in instructions-allow.mjs,
// with the page and the reason — never a blanket rule.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ALLOW } from './instructions-allow.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TOOLS = path.join(ROOT, 'app', 'tools');
const verbose = process.argv.includes('--verbose');

const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8').replace(/^﻿/, ''), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const INSTR = new Set(['howTo', 'tips', 'faqs']);
const nameOf = (n) => (n.name && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name)) ? n.name.text : null);

// All text pieces of a subtree (string literals, template pieces, JSX text).
function texts(node, out = []) {
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(n.text);
    else if (ts.isTemplateExpression(n)) { out.push(n.head.text); n.templateSpans.forEach((s) => { visit(s.expression); out.push(s.literal.text); }); return; }
    else if (ts.isJsxText(n)) out.push(n.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

// Instruction strings and the "rest" of the file, kept apart.
function split(sf) {
  const instr = []; const rest = [];
  const visit = (n) => {
    const isInstr = (ts.isPropertyAssignment(n) && INSTR.has(nameOf(n))) || (ts.isJsxAttribute(n) && INSTR.has(n.name.getText(sf)));
    if (isInstr) { instr.push(...texts(n)); return; }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) rest.push(n.text);
    else if (ts.isTemplateExpression(n)) rest.push(n.head.text, ...n.templateSpans.map((s) => s.literal.text));
    else if (ts.isJsxText(n)) rest.push(n.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { instr, rest, code: sf.getFullText() };
}

function localImports(file, sf) {
  const out = [];
  sf.statements.forEach((s) => {
    if (!ts.isImportDeclaration(s)) return;
    const spec = s.moduleSpecifier.text;
    const base = spec.startsWith('@/') ? path.join(ROOT, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : null;
    if (!base) return;
    for (const ext of ['', '.jsx', '.tsx', '.js', '.ts', '/index.jsx', '/index.js']) {
      const f = base + ext;
      if (fs.existsSync(f) && fs.statSync(f).isFile() && /\.(jsx|tsx|js|ts)$/.test(f)) { out.push(f); break; }
    }
  });
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9%+#'./-]+/g, ' ').replace(/\s+/g, ' ').trim();

// Quoted pieces: "…" and “…” (straight single quotes are apostrophes far too often to be read as quotes).
export function quoted(text) {
  const out = [];
  for (const m of text.matchAll(/"([^"\n]{1,60})"|“([^”\n]{1,60})”/g)) out.push((m[1] ?? m[2]).trim());
  // 'Single quotes' only around a capitalised label, so that "it's" and "files' names" are not read as quotes.
  for (const m of text.matchAll(/(?:^|[\s(])'([A-Z][^'\n]{0,40}?)'(?=[\s,.;:)!?]|$)/g)) out.push(m[1].trim());
  return out.filter((q) => q && /[A-Za-z]/.test(q));
}

// Unquoted: "click Merge PDF", "tap the Copy button" -- the capitalised words right after the verb.
export function clicked(text) {
  const out = [];
  const W = String.raw`(?:[A-Z][\w&+\-/]*|to|as|all|&|\d+)`;
  const re = new RegExp(String.raw`\b(?:[Cc]lick|[Tt]ap|[Pp]ress|[Hh]it)\s+(?:on\s+)?(?:the\s+)?([A-Z][\w&+\-/]*(?:\s+${W})*)`, 'g');
  for (const m of text.matchAll(re)) {
    const words = m[1].split(/\s+/);
    while (words.length && /^(to|as|all|&)$/.test(words[words.length - 1])) words.pop();
    if (words.length) out.push(words.join(' '));
  }
  // "the Convert button", "the Lossless option", "the Advanced tab"
  for (const m of text.matchAll(/\bthe\s+((?:[A-Z][\w&+\-/]*\s+){1,4}?)(button|option|tab|toggle|checkbox|menu|field|mode|switch|slider)\b/g)) out.push(m[1].trim());
  return out;
}

const GESTURES = [
  { name: 'drag to reorder', when: /\bdrag\w*\b[^.]{0,60}\b(reorder|rearrange|order|position|sort)|\b(reorder|rearrange)\w*\b[^.]{0,40}\bdrag/i, needs: /draggable|onDragStart|useSortable|Sortable/ },
  { name: 'arrows to reorder', when: /\b(up|down|↑|↓)\b[^.]{0,20}\barrows?\b|\barrows?\b[^.]{0,40}\b(reorder|move|order)/i, needs: /[↑↓▲▼]|ArrowUp|ArrowDown|ChevronUp|ChevronDown|MoveUp|MoveDown/ },
  { name: 'drop a file', when: /\bdrag(ging)?\s*(and|&|-|n)\s*drop\b(?![^.]{0,60}\b(reorder|rearrange|order|thumbnail))|\bdrop (your|the|a|an|one|any|several|multiple)\b[^.]{0,30}\b(file|image|photo|pdf|video|audio|document|archive|clip)s?\b|\bdrag (your|the|a|an)\b[^.]{0,30}\b(file|image|photo|pdf|video|document)s?\b[^.]{0,20}\b(on|in)to\b/i, needs: /onDrop|type=["']file["']/ }, // a file input gets dropped files site-wide (FileDropBridge)
  { name: 'slider', when: /\bslider\b/i, needs: /type=["']range["']|type: ?["']range["']/ },
  { name: 'checkbox', when: /\b(checkbox|tick (the|a)|check the box)\b/i, needs: /type=["']checkbox["']|role=["']checkbox["']|type: ?["']checkbox["']/ },
  { name: 'dropdown', when: /\bdrop-?down\b/i, needs: /<select\b|role=["']listbox["']|<datalist/ },
  { name: 'double-click', when: /\bdouble-?click/i, needs: /onDoubleClick|dblclick/ },
  { name: 'right-click', when: /\bright-?click/i, needs: /onContextMenu|contextmenu/ },
];

export function toolPages() {
  const pages = [];
  for (const cat of fs.readdirSync(TOOLS)) {
    const cdir = path.join(TOOLS, cat);
    if (!fs.statSync(cdir).isDirectory()) continue;
    for (const tool of fs.readdirSync(cdir)) {
      const tdir = path.join(cdir, tool);
      if (!fs.statSync(tdir).isDirectory()) continue;
      const page = ['page.jsx', 'page.tsx'].map((f) => path.join(tdir, f)).find((f) => fs.existsSync(f));
      if (page) pages.push({ slug: `${cat}/${tool}`, file: page });
    }
  }
  return pages;
}

// The page's instruction texts, the rest of its text, and its code (page, sibling files, local imports 2 levels).
export function readPage(file) {
  const sf = parse(file);
  const own = split(sf);
  const instr = [...own.instr];
  const rest = [...own.rest];
  let code = own.code;
  const seen = new Set([file]);
  for (const f of fs.readdirSync(path.dirname(file))) {
    const full = path.join(path.dirname(file), f);
    if (seen.has(full) || !/\.(jsx|tsx|js|ts)$/.test(f) || /^layout\./.test(f)) continue;
    seen.add(full);
    const s = split(parse(full)); instr.push(...s.instr); rest.push(...s.rest); code += '\n' + s.code;
  }
  let frontier = localImports(file, sf);
  for (let depth = 0; depth < 2; depth++) {
    const next = [];
    for (const f of frontier) {
      if (seen.has(f) || /toolsRegistry|toolIcons|SeoContent/.test(f)) continue;
      seen.add(f);
      const isf = parse(f);
      const s = split(isf);
      rest.push(...s.rest);
      code += '\n' + s.code;
      next.push(...localImports(f, isf));
    }
    frontier = next;
  }
  return { instr, rest, code };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) {
  const pages = toolPages();
  const problems = new Map();
  let quotedCount = 0;
  for (const { slug, file } of pages) {
    const { instr, rest, code } = readPage(file);
    const corpus = norm(rest.join(' \u0001 '));
    const allow = ALLOW[slug] || {};
    // The upload area's own words ("Click or drop a PDF here") are a promise too.
    const dropText = rest.find((t) => /\b(click|tap) or drop\b|\bdrop (your|a|an|the|any)\b[^.]{0,30}\bhere\b/i.test(t));
    if (dropText && !/onDrop|type=["']file["']/.test(code)) problems.set(`${slug}|gesture|drop zone`, { slug, kind: 'gesture', what: 'drop zone without file input', text: dropText });
    for (const t of instr) {
      for (const q of [...quoted(t), ...clicked(t)]) {
        quotedCount++;
        const n = norm(q.replace(/(\.\.\.|…)$/, ''));
        if (!n || corpus.includes(n) || allow[q]) continue;
        problems.set(`${slug}|label|${q}`, { slug, kind: 'label', what: q, text: t });
      }
      // A gesture named to say it is NOT there ("there's no quality slider") or asked about ("Can I drag…?") is not a
      // promise; the answer that follows is checked on its own.
      const promise = !/\?\s*$/.test(t) && !/\b(no|not|without|isn't|aren't|doesn't|don't|there's no|cannot|can't)\b/i.test(t);
      for (const g of GESTURES) {
        if (promise && g.when.test(t) && !g.needs.test(code) && !allow[`gesture:${g.name}`]) problems.set(`${slug}|gesture|${g.name}`, { slug, kind: 'gesture', what: g.name, text: t });
      }
    }
  }
  for (const p of problems.values()) console.log(`MISMATCH ${p.slug} [${p.kind}] ${JSON.stringify(p.what)}${verbose ? `\n    in: ${p.text}` : ''}`);
  console.log(`${pages.length} tool pages, ${quotedCount} quoted labels checked, ${problems.size} mismatch(es)`);
  process.exit(problems.size ? 1 : 0);
}
