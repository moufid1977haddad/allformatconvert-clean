// P33 (05/10): what PDF Redact may copy from the visitor's PDF, and the check of the file before it is handed over.
//
// Independent review of 05/10 (adversarial PDFs, docs/audit/RAPPORT-p33-redact-ocr-05-10.md §2e): the redacted pages
// themselves were safe (rebuilt from a picture), but pdf-lib's copyPages() of a page WITHOUT a match copies every
// object it can reach. The original of a redacted page came back into the file through a link of another page (a table
// of contents: /Dest → the page), a form field's /Parent → /Kids → the redacted page's field, a /Resources dictionary
// shared with the redacted page (its unused Form XObject), /PieceInfo; and a stamp, a file attachment, a rich-text
// comment or a JavaScript link of an untouched page kept the term — while the page said "no longer exists in the file".
//
// Now, before any page is copied:
//   1. every redacted page of the SOURCE becomes an empty shell (no content, resources, annotations, private data), so
//      anything that still points at it carries nothing;
//   2. each copied page keeps only what its own content uses: /Resources rebuilt with the XObjects and patterns its
//      content stream (and, recursively, those forms' and patterns' streams) names; /PieceInfo, /AA, /Metadata, /Thumb,
//      /B removed;
//   3. its annotations are filtered: kinds whose content this tool cannot read (stamps, file attachments, media, 3D…)
//      are removed; links keep a web address or a jump to a page that is kept, nothing else (JavaScript, launch,
//      remote files, links to a redacted page: removed); form widgets lose /Parent and /P (no path to other fields).
// Then verifyRedacted() reads the finished file again — PDF.js text, annotations and attachments of every page, every
// decodable stream as bytes, and the page objects themselves — and the file is refused if a term is still found or a
// page object exists outside the page tree with anything in it. It cannot see a term written with a font's private
// codes (CID) in a stream; steps 1-3 are what remove those.

// annotation kinds whose content PDF Redact cannot read: removed from the copied pages, blacked out on redacted ones
export const UNREADABLE_ANNOTATIONS = new Set(['Stamp', 'FileAttachment', 'Sound', 'Movie', 'Screen', 'RichMedia', '3D', 'Watermark', 'PrinterMark', 'TrapNet', 'Redact', 'Projection']);
const MAX_DEPTH = 8;

function bytesOf(lib, stream) {
  try {
    if (stream instanceof lib.PDFRawStream) return lib.decodePDFRawStream(stream).decode();
    if (typeof stream.getContents === 'function') return stream.getContents();
  } catch { /* a filter pdf-lib does not decode (DCT, JPX…): not a content stream */ }
  return null;
}
const latin1 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return s; };

// Names an operator list uses, per resource category (P33, second review: EVERY category is kept by what the content
// names — an ExtGState's soft mask or a /Properties ActualText used only by the redacted page came back otherwise).
// Escapes (#xx) are decoded: "/Im#31 Do" uses "Im1" (pdf-lib gives the resource keys decoded).
const NAME = String.raw`/([^\s/[\]<>(){}%]+)`;
const OPS = [
  ['XObject', new RegExp(`${NAME}\\s+Do\\b`, 'g')],
  ['Pattern', new RegExp(`${NAME}\\s+(?:scn|SCN)\\b`, 'g')],
  ['Shading', new RegExp(`${NAME}\\s+sh\\b`, 'g')],
  ['ExtGState', new RegExp(`${NAME}\\s+gs\\b`, 'g')],
  ['ColorSpace', new RegExp(`${NAME}\\s+(?:cs|CS)\\b`, 'g')],
  ['Font', new RegExp(`${NAME}\\s+[-+\\d.]+\\s+Tf\\b`, 'g')],
  ['Properties', new RegExp(`/[^\\s/[\\]<>(){}%]+\\s+${NAME}\\s+(?:BDC|DP)\\b`, 'g')],
];
const unescapeName = (n) => n.replace(/#([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
function usedNames(text) {
  if (text == null) return null;
  const out = {};
  for (const [cat, re] of OPS) { out[cat] = new Set(); for (const m of text.matchAll(re)) out[cat].add(unescapeName(m[1])); }
  // a colour space can also be named by a pattern or an image; images and patterns are kept by name above, their own
  // colour spaces travel inside them
  return out;
}

function contentText(lib, ctx, contents) {
  const obj = contents instanceof lib.PDFRef ? ctx.lookup(contents) : contents;
  if (!obj) return '';
  if (obj instanceof lib.PDFArray) {
    let s = '';
    for (let i = 0; i < obj.size(); i++) { const part = ctx.lookup(obj.get(i)); const b = part && bytesOf(lib, part); if (b == null) return null; s += latin1(b) + '\n'; }
    return s;
  }
  const b = bytesOf(lib, obj);
  return b == null ? null : latin1(b);
}

// a NEW /Resources dictionary holding only what `text` names, category by category (allow-list: an unknown category
// is dropped); forms, tiling patterns and soft-mask groups pruned the same way by their own content, recursively
function prunedResources(lib, ctx, res, text, depth, seen) {
  const { PDFName, PDFDict } = lib;
  const used = usedNames(text);
  if (!res) return ctx.obj({});
  if (!used) return res; // the content could not be decoded: kept as it is (verifyRedacted still checks the file)
  const out = ctx.obj({});
  const pruneStream = (ref) => {
    const target = ctx.lookup(ref);
    const id = ref && ref.toString();
    // a stream only (PDFDict also has an internal .dict map: a shading pattern is a plain dictionary)
    if (!(target instanceof lib.PDFStream) || depth >= MAX_DEPTH || seen.has(id)) return;
    seen.add(id);
    const own = target.dict.lookupMaybe(PDFName.of('Resources'), PDFDict);
    if (!own) return;
    const b = bytesOf(lib, target);
    target.dict.set(PDFName.of('Resources'), ctx.register(prunedResources(lib, ctx, own, b == null ? null : latin1(b), depth + 1, seen)));
  };
  for (const [k, v] of res.entries()) {
    const key = k.decodeText();
    if (key === 'ProcSet') { out.set(k, v); continue; }
    if (!used[key]) continue;
    const sub = res.lookupMaybe(k, PDFDict);
    if (!sub) continue;
    const kept = ctx.obj({});
    for (const [name, ref] of sub.entries()) {
      if (!used[key].has(name.decodeText())) continue;
      kept.set(name, ref);
      if (key === 'XObject' || key === 'Pattern') pruneStream(ref);
      if (key === 'ExtGState') {
        const gs = ctx.lookupMaybe(ref, PDFDict);
        const mask = gs && gs.lookupMaybe(PDFName.of('SMask'), PDFDict);
        if (mask && mask.get(PDFName.of('G'))) pruneStream(mask.get(PDFName.of('G')));
      }
    }
    out.set(k, kept);
  }
  return out;
}

// keys an annotation kept on a copied page may carry (second review: /DV, /NM… held the term)
const ANNOT_KEYS = new Set(['Type', 'Subtype', 'Rect', 'AP', 'AS', 'F', 'Border', 'BS', 'C', 'IC', 'CA', 'Contents', 'QuadPoints', 'A', 'Dest', 'H', 'FT', 'T', 'TU', 'V', 'Ff', 'DA', 'Q', 'MK', 'Opt', 'MaxLen', 'Name', 'Open', 'Popup', 'L', 'LE', 'Vertices', 'InkList', 'BE', 'RD']);
// keys a copied page may carry
const PAGE_KEYS = new Set(['Type', 'Parent', 'MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox', 'Rotate', 'Contents', 'Resources', 'Annots', 'Group', 'UserUnit', 'Tabs']);

const destPage = (lib, ctx, d) => {
  const arr = d instanceof lib.PDFRef ? ctx.lookup(d) : d;
  if (arr instanceof lib.PDFArray && arr.size() && arr.get(0) instanceof lib.PDFRef) return arr.get(0).toString();
  return null;
};

/**
 * Makes `doc` (pdf-lib, the visitor's PDF as loaded) safe to copy pages from. hit: 0-based indexes of the pages that
 * will be rebuilt from a picture. Returns counts of what was removed from the copied pages, for the summary.
 */
export function sanitizeForCopy(doc, hit, lib) {
  const { PDFName, PDFDict, PDFArray } = lib;
  const ctx = doc.context;
  const N = (s) => PDFName.of(s);
  const pages = doc.getPages();
  const hitSet = new Set(hit);
  const hitRefs = new Set(hit.map((i) => pages[i].ref.toString()));
  const removed = { annotations: 0, links: 0 };
  const pageIndex = new Map(pages.map((p, i) => [p.ref.toString(), i]));
  const byNumber = (holder, key) => {
    const v = holder.get(key);
    const arr = v instanceof lib.PDFRef ? ctx.lookup(v) : v;
    if (!(arr instanceof PDFArray) || !arr.size() || !(arr.get(0) instanceof lib.PDFRef)) return;
    const n = pageIndex.get(arr.get(0).toString());
    if (n === undefined) return;
    const items = [ctx.obj(n)];
    for (let i = 1; i < arr.size(); i++) items.push(arr.get(i));
    holder.set(key, ctx.obj(items));
  };

  // 1. redacted pages of the source: empty shells
  for (const i of hit) {
    const node = pages[i].node;
    for (const k of node.keys()) if (!['Type', 'Parent', 'MediaBox', 'CropBox', 'Rotate'].includes(k.decodeText())) node.delete(k);
    node.set(N('Contents'), ctx.register(ctx.stream('')));
    node.set(N('Resources'), ctx.obj({}));
  }

  const seen = new Set();
  pages.forEach((page, i) => {
    if (hitSet.has(i)) return;
    const node = page.node;
    // inherited attributes made explicit first (MediaBox, CropBox, Rotate, Resources may live on /Pages)
    for (const k of ['MediaBox', 'CropBox', 'Rotate']) { const v = node.getInheritableAttribute(N(k)); if (v && !node.get(N(k))) node.set(N(k), v); }
    for (const k of node.keys()) if (!PAGE_KEYS.has(k.decodeText())) node.delete(k);
    // 2. resources: only what this page's content uses (a fresh dictionary: a shared one is never edited in place)
    const text = contentText(lib, ctx, node.get(N('Contents')));
    node.set(N('Resources'), ctx.register(prunedResources(lib, ctx, node.Resources(), text, 0, seen)));
    // 3. annotations
    const annots = node.lookupMaybe(N('Annots'), PDFArray);
    if (!annots) return;
    const keep = [];
    for (let a = 0; a < annots.size(); a++) {
      const ref = annots.get(a);
      const d = ctx.lookupMaybe(ref, PDFDict);
      if (!d) continue;
      const sub = d.get(N('Subtype'))?.decodeText?.() || '';
      if (UNREADABLE_ANNOTATIONS.has(sub)) { removed.annotations++; continue; }
      for (const k of d.keys()) if (!ANNOT_KEYS.has(k.decodeText())) d.delete(k);
      // an appearance this tool cannot read is drawn by viewers from the annotation's own properties instead (second
      // review: a Square whose /AP drew the term; third review: a link's /AP too). A form field keeps only the
      // appearance it shows now: its other states (a check box's "on", a button's "pressed") could draw anything.
      if (sub !== 'Widget') d.delete(N('AP'));
      else {
        const ap = d.lookupMaybe(N('AP'), PDFDict);
        if (ap) {
          ap.delete(N('D'));
          ap.delete(N('R'));
          const nObj = ap.get(N('N')) && ctx.lookup(ap.get(N('N')));
          const states = nObj instanceof PDFDict ? nObj : null; // a dictionary of states, not one appearance stream
          if (states) {
            const as = d.get(N('AS'));
            const current = as && states.get(as);
            ap.set(N('N'), current ? ctx.obj({ [as.decodeText()]: current }) : ctx.obj({}));
          }
        }
      }
      const act = d.lookupMaybe(N('A'), PDFDict);
      if (act) {
        const s = act.get(N('S'))?.decodeText?.() || '';
        const toRedacted = s === 'GoTo' && hitRefs.has(destPage(lib, ctx, act.get(N('D'))));
        if (!['URI', 'GoTo', 'Named'].includes(s) || toRedacted || act.get(N('Next'))) {
          if (sub === 'Link') { removed.links++; continue; }
          d.delete(N('A'));
        }
      }
      if (d.get(N('Dest')) && hitRefs.has(destPage(lib, ctx, d.get(N('Dest'))))) { removed.links++; continue; }
      // third review: copyPages() of each page on its own copied the TARGET of a jump to another kept page (a table
      // of contents) a second time, as an orphan — the check then refused ordinary Word / LibreOffice files. The target
      // becomes its page number here, and the copied page's own reference after the copy (relinkDestinations).
      byNumber(d, N('Dest'));
      const a2 = d.lookupMaybe(N('A'), PDFDict);
      if (a2 && a2.get(N('S'))?.decodeText?.() === 'GoTo') byNumber(a2, N('D'));
      keep.push(ref);
    }
    node.set(N('Annots'), ctx.obj(keep));
  });
  return removed;
}

/** After the copy: a jump written as a page number by sanitizeForCopy points at that page of the new document. */
export function relinkDestinations(out, lib) {
  const { PDFName, PDFDict, PDFArray, PDFNumber } = lib;
  const N = (s) => PDFName.of(s);
  const pages = out.getPages();
  const fix = (holder, key) => {
    const arr = holder && holder.get(key);
    if (!(arr instanceof PDFArray) || !arr.size() || !(arr.get(0) instanceof PDFNumber)) return;
    const n = arr.get(0).asNumber();
    if (Number.isInteger(n) && n >= 0 && n < pages.length) arr.set(0, pages[n].ref);
  };
  for (const page of pages) {
    const annots = page.node.lookupMaybe(N('Annots'), PDFArray);
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i++) {
      const d = out.context.lookupMaybe(annots.get(i), PDFDict);
      if (!d) continue;
      fix(d, N('Dest'));
      const a = d.lookupMaybe(N('A'), PDFDict);
      if (a) fix(a, N('D'));
    }
  }
}

// the strings written in a content stream: (literal) with its escapes, and <hex> (read as bytes and as UTF-16BE)
function stringOperands(t) {
  const out = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '%') { while (i < t.length && t[i] !== '\n' && t[i] !== '\r') i++; continue; }
    if (c === '(') {
      let depth = 1, s = '';
      for (i++; i < t.length && depth; i++) {
        const d = t[i];
        if (d === '\\') { const e = t[++i]; if (/[0-7]/.test(e)) { let v = e; while (v.length < 3 && /[0-7]/.test(t[i + 1])) v += t[++i]; s += String.fromCharCode(parseInt(v, 8) & 255); } else s += ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' })[e] ?? e; }
        else if (d === '(') { depth++; s += d; } else if (d === ')') { depth--; if (depth) s += d; } else s += d;
      }
      i--;
      out.push(s);
      if (s.length >= 2 && s.charCodeAt(0) === 0xfe && s.charCodeAt(1) === 0xff) out.push(Array.from({ length: (s.length - 2) >> 1 }, (_, k) => String.fromCharCode((s.charCodeAt(2 + 2 * k) << 8) | s.charCodeAt(3 + 2 * k))).join(''));
      continue;
    }
    if (c === '<' && t[i + 1] !== '<') {
      const j = t.indexOf('>', i);
      if (j < 0) break;
      const h = t.slice(i + 1, j).replace(/\s+/g, '');
      if (/^[0-9a-fA-F]*$/.test(h)) {
        const bytes = h.match(/../g) || [];
        out.push(bytes.map((x) => String.fromCharCode(parseInt(x, 16))).join(''));
        out.push(Array.from({ length: bytes.length >> 1 }, (_, k) => String.fromCharCode(parseInt(bytes[2 * k] + bytes[2 * k + 1], 16))).join(''));
      }
      i = j;
    } else if (c === '<') i++;
  }
  return out;
}


/**
 * Reads the finished file again. terms: the visitor's terms; textMatches(strs, eols, page, items) (may be async) /
 * annotMatches(text): the page's
 * own matching (patterns included); glyphHit(page) (optional, P37 second review N4): whether a term is still DRAWN on a
 * PDF.js page (its glyphs in drawing order, app/lib/pdfRedact.js glyphTermMatches — PDF.js's text can read a right-to-
 * left phrase out of order or with its ligatures reversed). Resolves {ok: true} or {ok: false, reason}.
 */
export async function verifyRedacted(bytes, { terms, textMatches, annotMatches, annotText, pdfjsLib, lib, pageCount, glyphHit = null }) {
  // a. what PDF.js reads: the text of every page, its annotations, the attachments
  const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
  try {
    if (doc.numPages !== pageCount) return { ok: false, reason: `the file has ${doc.numPages} pages instead of ${pageCount}` };
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const items = (await page.getTextContent()).items.filter((it) => typeof it.str === 'string');
      if (await textMatches(items.map((it) => it.str), items.map((it) => !!it.hasEOL), page, items)) return { ok: false, reason: `a term is still in the text of page ${i}` };
      for (const an of await page.getAnnotations()) if (annotMatches(annotText(an))) return { ok: false, reason: `a term is still in an annotation of page ${i}` };
      if (glyphHit && await glyphHit(page, doc)) return { ok: false, reason: `a term is still drawn on page ${i}` };
    }
    const att = await doc.getAttachments();
    if (att && Object.keys(att).length) return { ok: false, reason: 'the file has attachments' };
  } finally {
    doc.destroy();
  }
  // b. the objects themselves (second review): every string of every dictionary and array, and the string operands of
  // every content-like stream (never names or operators, never a CMap or a font program: "/Registry (Adobe)" of any
  // embedded font refused a search for "Adobe"); the document information dictionary (Producer: pdf-lib) is skipped
  const { PDFName, PDFDict, PDFArray, PDFRawStream, PDFString, PDFHexString } = lib;
  const out = await lib.PDFDocument.load(bytes, { updateMetadata: false });
  const inTree = new Set(out.getPages().map((p) => p.ref.toString()));
  const info = out.context.trailerInfo.Info ? out.context.trailerInfo.Info.toString() : null;
  const SKIP_KEYS = new Set(['Registry', 'Ordering', 'BaseFont', 'FontName', 'FontFamily', 'Producer', 'Creator']);
  // a PDF date (D:2026…) is not a phone number
  const strHit = (str) => !!str && !/^D:\d{4}/.test(str) && annotMatches(str);
  const walk = (o, depth) => {
    if (!o || depth > 12) return false;
    if (o instanceof PDFString || o instanceof PDFHexString) { try { return strHit(o.decodeText()); } catch { return false; } }
    if (o instanceof PDFArray) { for (let i = 0; i < o.size(); i++) if (walk(o.get(i), depth + 1)) return true; return false; }
    if (o instanceof PDFDict) {
      const t = o.get(PDFName.of('Type'))?.decodeText?.();
      if (t === 'Font' || t === 'FontDescriptor') return false;
      for (const [k, v] of o.entries()) if (!SKIP_KEYS.has(k.decodeText()) && walk(v, depth + 1)) return true;
    }
    return false;
  };
  for (const [ref, obj] of out.context.enumerateIndirectObjects()) {
    if (ref.toString() === info) continue;
    const dict = obj instanceof PDFDict ? obj : obj && obj.dict;
    if (!dict) { if (walk(obj, 0)) return { ok: false, reason: 'a term is still in the file\'s data' }; continue; }
    const type = dict.get(PDFName.of('Type'))?.decodeText?.();
    if (type === 'Page' && !inTree.has(ref.toString())) {
      const empty = !dict.get(PDFName.of('Annots')) && !(dict.lookupMaybe(PDFName.of('Resources'), PDFDict)?.keys().length);
      if (!empty) return { ok: false, reason: 'a copy of a page is left outside the document' };
    }
    if (walk(dict, 0)) return { ok: false, reason: 'a term is still in the file\'s data' };
    if (!(obj instanceof PDFRawStream)) continue;
    const sub = dict.get(PDFName.of('Subtype'))?.decodeText?.();
    if (sub === 'Image' || type === 'CMap' || type === 'Metadata' || dict.get(PDFName.of('Length1')) || dict.get(PDFName.of('Length2')) || sub === 'Type1C' || sub === 'CIDFontType0C' || sub === 'OpenType' || dict.get(PDFName.of('N'))) continue;
    const b = bytesOf(lib, obj);
    if (!b) continue;
    const text = latin1(b);
    if (/begincmap/.test(text.slice(0, 4000))) continue;
    for (const str of stringOperands(text)) if (strHit(str)) return { ok: false, reason: 'a term is still in the file\'s data' };
  }
  return { ok: true };
}
