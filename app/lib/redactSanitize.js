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
const PAGE_PRIVATE = ['PieceInfo', 'AA', 'Metadata', 'Thumb', 'B', 'SeparationInfo', 'PresSteps'];
const MAX_DEPTH = 8;

function bytesOf(lib, stream) {
  try {
    if (stream instanceof lib.PDFRawStream) return lib.decodePDFRawStream(stream).decode();
    if (typeof stream.getContents === 'function') return stream.getContents();
  } catch { /* a filter pdf-lib does not decode (DCT, JPX…): not a content stream */ }
  return null;
}
const latin1 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return s; };

// names an operator list uses: /Name Do (XObjects), /Name scn|SCN (patterns), /Name sh (shadings)
function usedNames(text) {
  const out = { xo: new Set(), pat: new Set() };
  if (text == null) return null;
  for (const m of text.matchAll(/\/([^\s/[\]<>(){}%]+)\s+Do\b/g)) out.xo.add('/' + m[1]);
  for (const m of text.matchAll(/\/([^\s/[\]<>(){}%]+)\s+(?:scn|SCN)\b/g)) out.pat.add('/' + m[1]);
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

// a NEW /Resources dictionary holding only what `text` uses (forms and tiling patterns pruned the same way, recursively)
function prunedResources(lib, ctx, res, text, depth, seen) {
  const { PDFName, PDFDict } = lib;
  const used = usedNames(text);
  if (!res) return ctx.obj({});
  if (!used) return res; // the content could not be decoded: kept as it is (verifyRedacted still checks the file)
  const out = ctx.obj({});
  for (const [k, v] of res.entries()) {
    const key = k.decodeText();
    if (key !== 'XObject' && key !== 'Pattern') { out.set(k, v); continue; }
    const sub = res.lookupMaybe(k, PDFDict);
    if (!sub) continue;
    const kept = ctx.obj({});
    for (const [name, ref] of sub.entries()) {
      if (!(key === 'XObject' ? used.xo : used.pat).has(name.asString())) continue;
      kept.set(name, ref);
      const target = ctx.lookup(ref);
      const id = ref.toString();
      if (target && target.dict && depth < MAX_DEPTH && !seen.has(id)) {
        seen.add(id);
        const isForm = key === 'XObject' ? target.dict.get(PDFName.of('Subtype'))?.decodeText?.() === 'Form' : true;
        const own = target.dict.lookupMaybe(PDFName.of('Resources'), PDFDict);
        if (isForm && own) {
          const b = bytesOf(lib, target);
          target.dict.set(PDFName.of('Resources'), ctx.register(prunedResources(lib, ctx, own, b == null ? null : latin1(b), depth + 1, seen)));
        }
      }
    }
    out.set(k, kept);
  }
  return out;
}

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
    for (const k of PAGE_PRIVATE) node.delete(N(k));
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
      for (const k of ['AA', 'P', 'IRT', 'Parent']) d.delete(N(k));
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
      keep.push(ref);
    }
    node.set(N('Annots'), ctx.obj(keep));
  });
  return removed;
}

const norm = (s) => s.normalize('NFKD').replace(/[\p{M}¨´ˆ-˝`¯¸]/gu, '').toLowerCase().replace(/\s+/g, '').replace(/[-­‐-―−]/g, '');

/**
 * Reads the finished file again. terms: the visitor's terms; textMatches(strs, eols) / annotMatches(text): the page's
 * own matching (patterns included). Resolves {ok: true} or {ok: false, reason}.
 */
export async function verifyRedacted(bytes, { terms, textMatches, annotMatches, annotText, pdfjsLib, lib, pageCount }) {
  // a. what PDF.js reads: the text of every page, its annotations, the attachments
  const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
  try {
    if (doc.numPages !== pageCount) return { ok: false, reason: `the file has ${doc.numPages} pages instead of ${pageCount}` };
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const items = (await page.getTextContent()).items.filter((it) => typeof it.str === 'string');
      if (textMatches(items.map((it) => it.str), items.map((it) => !!it.hasEOL))) return { ok: false, reason: `a term is still in the text of page ${i}` };
      for (const an of await page.getAnnotations()) if (annotMatches(annotText(an))) return { ok: false, reason: `a term is still in an annotation of page ${i}` };
    }
    const att = await doc.getAttachments();
    if (att && Object.keys(att).length) return { ok: false, reason: 'the file has attachments' };
  } finally {
    doc.destroy();
  }
  // b. the objects themselves: every decodable stream that is not a picture or a font, as bytes; the page objects
  const { PDFName, PDFDict, PDFRawStream } = lib;
  const out = await lib.PDFDocument.load(bytes, { updateMetadata: false });
  const inTree = new Set(out.getPages().map((p) => p.ref.toString()));
  const needles = terms.filter((t) => norm(t).length >= 4).map((t) => {
    const low = t.toLowerCase();
    return [low, Array.from(new TextEncoder().encode(low), (b) => b.toString(16).padStart(2, '0')).join(''), Array.from(low, (c) => c.charCodeAt(0).toString(16).padStart(4, '0')).join('')];
  });
  for (const [ref, obj] of out.context.enumerateIndirectObjects()) {
    const dict = obj instanceof PDFDict ? obj : obj && obj.dict;
    if (!dict) continue;
    const type = dict.get(PDFName.of('Type'))?.decodeText?.();
    if (type === 'Page' && !inTree.has(ref.toString())) {
      const empty = !dict.get(PDFName.of('Annots')) && !(dict.lookupMaybe(PDFName.of('Resources'), PDFDict)?.keys().length);
      if (!empty) return { ok: false, reason: 'a copy of a page is left outside the document' };
    }
    if (!(obj instanceof PDFRawStream) || !needles.length) continue;
    const sub = dict.get(PDFName.of('Subtype'))?.decodeText?.();
    if (sub === 'Image' || dict.get(PDFName.of('Length1')) || dict.get(PDFName.of('Length2')) || sub === 'Type1C' || sub === 'CIDFontType0C' || sub === 'OpenType' || dict.get(PDFName.of('N'))) continue;
    const b = bytesOf(lib, obj);
    if (!b) continue;
    const s = latin1(b).toLowerCase();
    // hex strings only (<…>, not dictionaries): the digits of numbers elsewhere must not be read as hex text
    const hex = Array.from(s.matchAll(/<([0-9a-f\s]+)>/g), (m) => m[1].replace(/\s+/g, '')).join('|');
    if (needles.some(([low, h8, h16]) => s.includes(low) || hex.includes(h8) || hex.includes(h16))) return { ok: false, reason: 'a term is still in the file\'s data' };
  }
  return { ok: true };
}
