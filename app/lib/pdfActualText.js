// P27: the in-browser twin of services/pdf-tools/py/actualtext.py, for the PDF tools that READ text with PDF.js in the
// visitor's browser (Extract Text, Compare, Redact, Translate, AI Summary, PDF to HTML, PDF to Excel).
//
// Measured (docs/audit/RAPPORT-p27-nuit-04-10.md): LibreOffice draws some accented letters as two glyphs -- the base
// letter (with Unicode text) and an accent glyph WITHOUT any -- and puts the real letter ("é") in the /ActualText of a
// marked-content span around them. PDF.js reads ActualText only from the structure tree, not from the page's content,
// so PDF Extract Text gave "donne\bes" for "données" on a real 3-page document. Here the accent glyph gets, in its
// font's ToUnicode CMap, the combining accent its own ActualText says; PDF.js then reads "données".
//
// Same narrow rules as the server version (independent review, P27): only COMBINING MARKS, each right after a base glyph
// that already has text, at most one per base; never a span in a right-to-left or reordered script; never a code that
// already has text; a ToUnicode shared by several fonts, a font that is not an indirect object, a CMap this parser does
// not fully read (usecmap, names…), a Type0 font that is not Identity-H/V: left alone. Encrypted files are left alone.
// Only the copy given to PDF.js changes (page content and drawing untouched); the visitor's file is never modified.
//
//   const bytes = await withActualTextUnicode(originalBytes)   // the same bytes when there is nothing to add
// parsing runs on the page's thread: bigger files are passed through untouched (seconds of a frozen page otherwise)
const MAX_BYTES = 25 * 1024 * 1024;

const ENTRY = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g;
const RANGE = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g;

const hexToUtf16 = (h) => {
  let s = '';
  for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(parseInt(h.slice(i, i + 4), 16));
  return s;
};

function parseToUnicode(data) {
  if (data.includes('usecmap')) return null;
  const map = new Map();
  for (const [, block] of data.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    const body = block.trim();
    if (body.replace(ENTRY, '').trim()) return null;
    for (const [, a, b] of body.matchAll(ENTRY)) map.set(parseInt(a, 16), hexToUtf16(b));
  }
  for (const [, block] of data.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    const body = block.trim();
    if (body.replace(RANGE, '').trim()) return null;
    for (const [, a, b, c] of body.matchAll(RANGE)) {
      if (c.length < 4) return null;
      const head = c.slice(0, -4), last = parseInt(c.slice(-4), 16);
      for (let code = parseInt(a, 16), i = 0; code <= parseInt(b, 16); code++, i++) map.set(code, hexToUtf16(head) + String.fromCharCode((last + i) & 0xffff));
    }
  }
  return map;
}

// ---- content stream tokenizer: just what is needed to follow fonts, strings and marked content -------------------
const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);
function* tokens(b) {
  let i = 0;
  const n = b.length;
  while (i < n) {
    const c = b[i];
    if (WS.has(c)) { i++; continue; }
    if (c === 37) { while (i < n && b[i] !== 10 && b[i] !== 13) i++; continue; } // % comment
    if (c === 40) { // (literal string)
      const out = [];
      let depth = 1; i++;
      while (i < n && depth) {
        const d = b[i++];
        if (d === 92) { // backslash
          const e = b[i++];
          if (e >= 48 && e <= 55) { let v = e - 48; for (let k = 0; k < 2 && b[i] >= 48 && b[i] <= 55; k++) v = v * 8 + (b[i++] - 48); out.push(v & 0xff); }
          else if (e === 110) out.push(10); else if (e === 114) out.push(13); else if (e === 116) out.push(9);
          else if (e === 98) out.push(8); else if (e === 102) out.push(12);
          else if (e === 13) { if (b[i] === 10) i++; } else if (e === 10) { /* line continuation */ } else out.push(e);
        } else if (d === 40) { depth++; out.push(d); } else if (d === 41) { depth--; if (depth) out.push(d); } else out.push(d);
      }
      yield { t: 'str', v: Uint8Array.from(out) };
      continue;
    }
    if (c === 60 && b[i + 1] === 60) { yield { t: '<<' }; i += 2; continue; }
    if (c === 62 && b[i + 1] === 62) { yield { t: '>>' }; i += 2; continue; }
    if (c === 60) { // <hex string>
      let j = i + 1, hex = '';
      while (j < n && b[j] !== 62) { if (!WS.has(b[j])) hex += String.fromCharCode(b[j]); j++; }
      i = j + 1;
      if (hex.length % 2) hex += '0';
      const v = new Uint8Array(hex.length / 2);
      for (let k = 0; k < v.length; k++) v[k] = parseInt(hex.slice(2 * k, 2 * k + 2), 16);
      yield { t: 'str', v };
      continue;
    }
    if (c === 91) { yield { t: '[' }; i++; continue; }
    if (c === 93) { yield { t: ']' }; i++; continue; }
    if (c === 47) { // /Name
      let j = i + 1;
      while (j < n && !WS.has(b[j]) && !DELIM.has(b[j])) j++;
      yield { t: 'name', v: String.fromCharCode(...b.subarray(i + 1, j)).replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) };
      i = j;
      continue;
    }
    let j = i;
    while (j < n && !WS.has(b[j]) && !DELIM.has(b[j])) j++;
    if (j === i) { i++; continue; }
    const word = String.fromCharCode(...b.subarray(i, j));
    i = j;
    if (word === 'BI') { // inline image: skip to "EI" after "ID"
      const id = indexOfWord(b, 'ID', i);
      const ei = id < 0 ? -1 : indexOfWord(b, 'EI', id + 3);
      if (ei < 0) return;
      i = ei + 2;
      continue;
    }
    yield /^[+-]?(\d+\.?\d*|\.\d+)$/.test(word) ? { t: 'num', v: Number(word) } : { t: 'op', v: word };
  }
}
function indexOfWord(b, w, from) {
  const a = w.charCodeAt(0), c = w.charCodeAt(1);
  for (let i = from; i + 1 < b.length; i++) {
    if (b[i] === a && b[i + 1] === c && (i === 0 || WS.has(b[i - 1])) && (i + 2 >= b.length || WS.has(b[i + 2]))) return i;
  }
  return -1;
}
// operands stack -> operator
function* operations(bytes) {
  const stack = [];
  const nest = [];
  for (const tk of tokens(bytes)) {
    if (tk.t === '[' || tk.t === '<<') { nest.push({ kind: tk.t, items: [] }); continue; }
    if (tk.t === ']' || tk.t === '>>') {
      const top = nest.pop();
      if (!top) continue;
      let val;
      if (top.kind === '[') val = { t: 'arr', v: top.items };
      else { const d = {}; for (let k = 0; k + 1 < top.items.length; k += 2) if (top.items[k].t === 'name') d[top.items[k].v] = top.items[k + 1]; val = { t: 'dict', v: d }; }
      (nest.length ? nest[nest.length - 1].items : stack).push(val);
      continue;
    }
    if (nest.length) { nest[nest.length - 1].items.push(tk); continue; }
    if (tk.t === 'op') { yield { op: tk.v, args: stack.splice(0) }; continue; }
    stack.push(tk);
  }
}

const textOf = (bytesOrString) => (typeof bytesOrString === 'string' ? bytesOrString : new TextDecoder('latin1').decode(bytesOrString));
const pdfStringToText = (v) => {
  // a PDF text string: UTF-16BE with BOM, else PDFDocEncoding (≈ Latin-1 for letters)
  if (v.length >= 2 && v[0] === 0xfe && v[1] === 0xff) { let s = ''; for (let i = 2; i + 1 < v.length; i += 2) s += String.fromCharCode((v[i] << 8) | v[i + 1]); return s; }
  return String.fromCharCode(...v);
};
const visualOrder = (text) => /[֐-ࣿऀ-෿฀-໿က-႟ក-៿꣠-ꣿᬀ-᭿יִ-﷿ﹰ-﻿]/.test(text);

export async function withActualTextUnicode(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (!input.length || input.length > MAX_BYTES) return bytes;
  try {
    const { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFArray, PDFRef, decodePDFRawStream } = await import('pdf-lib');
    let doc;
    try { doc = await PDFDocument.load(input, { updateMetadata: false, throwOnInvalidObject: true }); } catch { return bytes; }
    if (doc.isEncrypted) return bytes;
    const ctx = doc.context;
    const deref = (o) => (o instanceof PDFRef ? ctx.lookup(o) : o);
    const streamBytes = (s) => { try { return decodePDFRawStream(s).decode(); } catch { return null; } };

    // how many fonts use each ToUnicode stream
    const users = new Map();
    for (const [, obj] of ctx.enumerateIndirectObjects()) {
      if (obj instanceof PDFDict && obj.get(PDFName.of('Type')) === PDFName.of('Font')) {
        const tu = obj.get(PDFName.of('ToUnicode'));
        if (tu instanceof PDFRef) users.set(tu.toString(), (users.get(tu.toString()) || 0) + 1);
      }
    }
    const cmaps = new Map(); // ToUnicode ref -> { ref, map, width, add: Map, conflict: Set }
    const infoFor = (fontRef) => {
      if (!(fontRef instanceof PDFRef)) return null; // a direct font dictionary: left alone
      const font = ctx.lookup(fontRef);
      if (!(font instanceof PDFDict)) return null;
      const sub = font.get(PDFName.of('Subtype'));
      let width = 1;
      if (sub === PDFName.of('Type0')) {
        const enc = font.get(PDFName.of('Encoding'));
        if (enc !== PDFName.of('Identity-H') && enc !== PDFName.of('Identity-V')) return null;
        width = 2;
      }
      const tuRef = font.get(PDFName.of('ToUnicode'));
      if (!(tuRef instanceof PDFRef) || users.get(tuRef.toString()) !== 1) return null;
      const key = tuRef.toString();
      if (!cmaps.has(key)) {
        const tu = ctx.lookup(tuRef);
        const data = tu instanceof PDFRawStream ? streamBytes(tu) : null;
        const map = data ? parseToUnicode(textOf(data)) : null;
        cmaps.set(key, map ? { ref: tuRef, map, width, add: new Map(), conflict: new Set(), text: textOf(data) } : null);
      }
      return cmaps.get(key);
    };

    const align = (span) => {
      const { codes } = span;
      if (!codes.length || codes.includes(null) || visualOrder(span.text)) return;
      const chars = [...span.text.normalize('NFD')];
      let pos = 0, prevMapped = false;
      const pending = [];
      for (const [info, code] of codes) {
        const known = info.map.get(code);
        if (known !== undefined) {
          const k = [...known.normalize('NFD')];
          if (!k.length || chars.slice(pos, pos + k.length).join('') !== k.join('')) return;
          pos += k.length; prevMapped = true;
        } else {
          if (pos >= chars.length || !prevMapped || !/\p{M}/u.test(chars[pos])) return;
          pending.push([info, code, chars[pos]]); pos++; prevMapped = false;
        }
      }
      if (pos !== chars.length) return;
      for (const [info, code, ch] of pending) {
        if (info.add.has(code) && info.add.get(code) !== ch) info.conflict.add(code);
        info.add.set(code, ch);
      }
    };

    const seenForms = new Set();
    const walk = (contentBytes, resources) => {
      const fontDict = resources && deref(resources.get(PDFName.of('Font')));
      const xobjects = resources && deref(resources.get(PDFName.of('XObject')));
      let cur = null;
      const saved = [], stack = [];
      for (const { op, args } of operations(contentBytes)) {
        if (op === 'q') saved.push(cur);
        else if (op === 'Q') cur = saved.length ? saved.pop() : null;
        else if (op === 'Tf') { const nm = args[0]?.t === 'name' ? args[0].v : null; const ref = nm && fontDict instanceof PDFDict ? fontDict.get(PDFName.of(nm)) : null; cur = ref ? infoFor(ref) : null; }
        else if (op === 'BDC' || op === 'BMC') {
          const props = op === 'BDC' ? args[1] : null;
          const at = props?.t === 'dict' ? props.v.ActualText : null;
          stack.push(at && at.t === 'str' && !stack.some(Boolean) ? { text: pdfStringToText(at.v), codes: [] } : null);
        } else if (op === 'EMC') { const span = stack.pop(); if (span) align(span); }
        else if (op === 'Tj' || op === 'TJ' || op === "'" || op === '"') {
          const span = stack.find(Boolean);
          if (!span) continue;
          if (!cur) { span.codes.push(null); continue; }
          const items = op === 'TJ' ? (args[0]?.t === 'arr' ? args[0].v : []) : [args[args.length - 1]];
          for (const it of items) {
            if (it?.t !== 'str') continue;
            if (it.v.length % cur.width) { span.codes.push(null); continue; }
            for (let i = 0; i < it.v.length; i += cur.width) span.codes.push([cur, cur.width === 2 ? (it.v[i] << 8) | it.v[i + 1] : it.v[i]]);
          }
        } else if (op === 'Do' && xobjects instanceof PDFDict && args[0]?.t === 'name') {
          const ref = xobjects.get(PDFName.of(args[0].v));
          const xo = deref(ref);
          if (xo instanceof PDFRawStream && xo.dict.get(PDFName.of('Subtype')) === PDFName.of('Form') && !seenForms.has(String(ref))) {
            seenForms.add(String(ref));
            const body = streamBytes(xo);
            if (body) walk(body, deref(xo.dict.get(PDFName.of('Resources'))) || resources);
          }
        }
      }
    };

    for (const page of doc.getPages()) {
      const contents = deref(page.node.get(PDFName.of('Contents')));
      const parts = contents instanceof PDFArray ? contents.asArray().map(deref) : [contents];
      const chunks = parts.filter((s) => s instanceof PDFRawStream).map(streamBytes);
      if (chunks.includes(null)) continue;
      const total = new Uint8Array(chunks.reduce((s, c) => s + c.length + 1, 0));
      let o = 0;
      for (const c of chunks) { total.set(c, o); o += c.length; total[o++] = 10; }
      walk(total, page.node.Resources());
    }

    let added = 0;
    for (const info of cmaps.values()) {
      if (!info) continue;
      const adds = [...info.add].filter(([code]) => !info.conflict.has(code) && !info.map.has(code)).sort((a, b) => a[0] - b[0]);
      if (!adds.length || (info.text.match(/endcmap/g) || []).length !== 1) continue;
      const hex = (code) => code.toString(16).toUpperCase().padStart(info.width * 2, '0');
      const u16 = (ch) => [...ch].map((c) => c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join('');
      let blocks = '';
      for (let i = 0; i < adds.length; i += 100) {
        const chunk = adds.slice(i, i + 100);
        blocks += `${chunk.length} beginbfchar\n${chunk.map(([c, ch]) => `<${hex(c)}> <${u16(ch)}>`).join('\n')}\nendbfchar\n`;
      }
      ctx.assign(info.ref, ctx.stream(info.text.replace('endcmap', `${blocks}endcmap`)));
      added += adds.length;
    }
    if (!added) return bytes;
    return await doc.save({ updateFieldAppearances: false });
  } catch {
    return bytes; // never in the way of the tool: the original bytes, exactly as before
  }
}
