// Document-level data kept when pages are copied into a new PDF (audit 2, 29/09, PDF Organize).
// copyPages copies each page with its annotations -- form widgets included, and through them their field
// dictionaries -- but not the catalog's AcroForm, so the fields of the new file no longer worked as a form; the
// title, author, subject and keywords were lost too. Copying into a new document is kept (a removed page must not
// stay in the file as an orphan object); here the AcroForm is rebuilt with the fields whose widgets are on the copied
// pages, and the document information is copied.

export function carryOver(lib, src, out) {
  const { PDFName, PDFDict, PDFArray, PDFRef } = lib;
  for (const [get, set] of [['getTitle', 'setTitle'], ['getAuthor', 'setAuthor'], ['getSubject', 'setSubject'], ['getKeywords', 'setKeywords']]) {
    const v = src[get]();
    if (v) out[set](v);
  }
  const srcForm = src.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  if (!srcForm) return;
  const ctx = out.context;
  const roots = [];
  const seen = new Set();
  for (const page of out.getPages()) {
    const annots = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i++) {
      let ref = annots.get(i);
      let d = ctx.lookup(ref);
      if (!(d instanceof PDFDict) || String(d.get(PDFName.of('Subtype'))) !== '/Widget') continue;
      while (d.get(PDFName.of('Parent')) instanceof PDFRef) { ref = d.get(PDFName.of('Parent')); d = ctx.lookup(ref); }
      if (ref instanceof PDFRef && !seen.has(ref.tag)) { seen.add(ref.tag); roots.push(ref); }
    }
  }
  if (!roots.length) return;
  const copier = lib.PDFObjectCopier.for(src.context, ctx);
  const form = ctx.obj({ Fields: roots });
  for (const key of ['DA', 'DR', 'NeedAppearances', 'Q']) {
    const v = srcForm.get(PDFName.of(key));
    if (v !== undefined) form.set(PDFName.of(key), copier.copy(v));
  }
  out.catalog.set(PDFName.of('AcroForm'), ctx.register(form));
}

// Bookmarks (the outline) kept (30/09, known gap of 29/09): the catalog's Outlines are not copied by copyPages either.
// As in Acrobat and PDFWix, each bookmark follows its page to its new position; a bookmark whose page was removed is
// dropped and its children move up to its place; bookmarks without a destination (folders) stay while they hold
// others; links to web pages stay. Named destinations are resolved to explicit ones. `order`: the 1-based source page
// of each output page (a page used twice points to its first copy).
export function carryOutline(lib, src, out, order) {
  const items = outlineItems(lib, src, out, order, 0);
  if (!items.length) return 0;
  writeOutline(lib, out, items);
  if (String(src.catalog.get(lib.PDFName.of('PageMode'))) === '/UseOutlines') out.catalog.set(lib.PDFName.of('PageMode'), lib.PDFName.of('UseOutlines'));
  return items.length;
}

// P24 (03/10, PDF Merge): the bookmark items of one source, its pages placed from output page `offset` on.
export function outlineItems(lib, src, out, order, offset = 0) {
  const { PDFName, PDFDict, PDFArray, PDFRef, PDFString, PDFHexString, PDFNumber } = lib;
  const N = (s) => PDFName.of(s);
  const outlines = src.catalog.lookupMaybe(N('Outlines'), PDFDict);
  if (!outlines) return [];
  const sctx = src.context, ctx = out.context;
  const srcPages = src.getPages(), outPages = out.getPages();
  const target = new Map(); // source page ref tag -> output page ref
  order.forEach((n, i) => { const ref = srcPages[n - 1]?.ref; if (ref && !target.has(ref.tag) && outPages[offset + i]) target.set(ref.tag, outPages[offset + i].ref); });
  const copier = lib.PDFObjectCopier.for(sctx, ctx);

  const named = (name) => {
    const key = name instanceof PDFName ? name.decodeText() : name.decodeText();
    const old = src.catalog.lookupMaybe(N('Dests'), PDFDict);
    if (old) { for (const [k, v] of old.entries()) if (k.decodeText() === key) return sctx.lookup(v); }
    const tree = src.catalog.lookupMaybe(N('Names'), PDFDict)?.lookupMaybe(N('Dests'), PDFDict);
    const walk = (node, depth) => {
      if (!node || depth > 32) return undefined;
      const names = node.lookupMaybe(N('Names'), PDFArray);
      if (names) for (let i = 0; i + 1 < names.size(); i += 2) {
        const k = names.lookup(i);
        if ((k instanceof PDFString || k instanceof PDFHexString) && k.decodeText() === key) return sctx.lookup(names.get(i + 1));
      }
      const kids = node.lookupMaybe(N('Kids'), PDFArray);
      if (kids) for (let i = 0; i < kids.size(); i++) { const r = walk(kids.lookupMaybe(i, PDFDict), depth + 1); if (r) return r; }
      return undefined;
    };
    return walk(tree, 0);
  };
  // An explicit destination on the output page, or null if its page is gone; undefined when the item has none.
  const destOf = (item) => {
    let d = item.lookup(N('Dest'));
    if (d === undefined) {
      const a = item.lookupMaybe(N('A'), PDFDict);
      if (!a || String(a.get(N('S'))) !== '/GoTo') return undefined;
      d = a.lookup(N('D'));
    }
    if (d instanceof PDFName || d instanceof PDFString || d instanceof PDFHexString) d = named(d);
    if (d instanceof PDFDict) d = d.lookup(N('D')); // named destination stored as << /D [...] >>
    if (!(d instanceof PDFArray) || !d.size()) return null;
    const page = d.get(0);
    const to = page instanceof PDFRef ? target.get(page.tag) : page instanceof PDFNumber ? target.get(srcPages[page.asNumber()]?.ref.tag) : undefined;
    if (!to) return null;
    const arr = ctx.obj([to]);
    for (let i = 1; i < d.size(); i++) arr.push(copier.copy(d.get(i)));
    return arr;
  };

  const seen = new Set();
  // Returns the kept output items for a source item's children list (dropped items give their children instead).
  const build = (first, depth) => {
    const res = [];
    let ref = first;
    while (ref instanceof PDFRef && !seen.has(ref.tag) && depth < 64) {
      seen.add(ref.tag);
      const item = sctx.lookup(ref);
      if (!(item instanceof PDFDict)) break;
      const children = build(item.get(N('First')), depth + 1);
      const dest = destOf(item);
      const action = item.lookupMaybe(N('A'), PDFDict);
      const keepsAction = dest === undefined && action && String(action.get(N('S'))) !== '/GoTo';
      if (dest === null || (dest === undefined && !keepsAction && !children.length)) res.push(...children);
      else {
        const o = ctx.obj({});
        o.set(N('Title'), copier.copy(item.lookup(N('Title')) ?? PDFString.of('')));
        if (dest) o.set(N('Dest'), dest);
        else if (keepsAction) o.set(N('A'), copier.copy(action));
        for (const k of ['C', 'F']) { const v = item.lookup(N(k)); if (v !== undefined) o.set(N(k), copier.copy(v)); }
        const count = item.lookup(N('Count'));
        res.push({ dict: o, children, open: !(count instanceof PDFNumber) || count.asNumber() > 0 });
      }
      ref = item.get(N('Next'));
    }
    return res;
  };
  return build(outlines.get(N('First')), 0);
}

// Writes items ({ dict, children, open }) as the output's outline.
export function writeOutline(lib, out, items) {
  const { PDFName, PDFNumber } = lib;
  const N = (s) => PDFName.of(s);
  const ctx = out.context;
  // Links the items under `parent`; returns how many are visible when the parent is open.
  const link = (items, parentRef) => {
    const refs = items.map((it) => ctx.register(it.dict));
    let visible = 0;
    items.forEach((it, i) => {
      it.dict.set(N('Parent'), parentRef);
      if (i) it.dict.set(N('Prev'), refs[i - 1]);
      if (i < items.length - 1) it.dict.set(N('Next'), refs[i + 1]);
      visible++;
      if (it.children.length) {
        const inner = link(it.children, refs[i]);
        it.dict.set(N('Count'), PDFNumber.of(it.open ? inner : -inner));
        if (it.open) visible += inner;
      }
    });
    items.forEach((it) => {
      if (!it.children.length) return;
      it.dict.set(N('First'), it.children[0].ref);
      it.dict.set(N('Last'), it.children[it.children.length - 1].ref);
    });
    items.forEach((it, i) => { it.ref = refs[i]; });
    return visible;
  };
  if (!items.length) return 0;
  const root = ctx.obj({ Type: 'Outlines' });
  const rootRef = ctx.register(root);
  const visible = link(items, rootRef);
  root.set(N('First'), items[0].ref);
  root.set(N('Last'), items[items.length - 1].ref);
  root.set(N('Count'), PDFNumber.of(visible));
  out.catalog.set(N('Outlines'), rootRef);
  return items.length;
}

// P24 (03/10, PDF Merge): the form fields of several sources in one AcroForm. copyPages brings each page's widgets
// but no AcroForm (the merged file's fields stopped working as a form); two files with a field of the same name
// would also share its value. Root fields whose name is already taken get a suffix (_2, _3…). Returns the renames.
export function carryFormsMany(lib, sources, out) {
  const { PDFName, PDFDict, PDFArray, PDFRef, PDFString, PDFHexString } = lib;
  const ctx = out.context;
  const pages = out.getPages();
  const roots = [], used = new Set(), renamed = [];
  let form = null, needAppearances = false;
  const fonts = ctx.obj({}); // review (03/10): the /DR fonts of every source, so each field's /DA font is found
  for (const { src, from, to } of sources) {
    const srcForm = src.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
    if (!srcForm) continue;
    const seen = new Set();
    for (let p = from; p < to; p++) {
      const annots = pages[p]?.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      if (!annots) continue;
      for (let i = 0; i < annots.size(); i++) {
        let ref = annots.get(i), d = ctx.lookup(ref);
        if (!(d instanceof PDFDict) || String(d.get(PDFName.of('Subtype'))) !== '/Widget') continue;
        while (d.get(PDFName.of('Parent')) instanceof PDFRef) { ref = d.get(PDFName.of('Parent')); d = ctx.lookup(ref); }
        if (!(ref instanceof PDFRef) || seen.has(ref.tag)) continue;
        seen.add(ref.tag);
        const t = d.lookup(PDFName.of('T'));
        const name = t instanceof PDFString || t instanceof PDFHexString ? t.decodeText() : null;
        if (name !== null) {
          let n = name, k = 2;
          while (used.has(n)) n = `${name}_${k++}`;
          if (n !== name) { d.set(PDFName.of('T'), PDFHexString.fromText(n)); renamed.push([name, n]); }
          used.add(n);
        }
        roots.push(ref);
      }
    }
    const copier = lib.PDFObjectCopier.for(src.context, ctx);
    if (!form) {
      form = ctx.obj({});
      for (const key of ['DA', 'Q']) { const v = srcForm.get(PDFName.of(key)); if (v !== undefined) form.set(PDFName.of(key), copier.copy(v)); }
    }
    const dr = srcForm.lookupMaybe(PDFName.of('DR'), PDFDict);
    const srcFonts = dr && dr.lookupMaybe(PDFName.of('Font'), PDFDict);
    if (srcFonts) for (const [k, v] of srcFonts.entries()) if (!fonts.get(k)) fonts.set(k, copier.copy(v));
    if (String(srcForm.get(PDFName.of('NeedAppearances'))) === 'true') needAppearances = true;
  }
  if (!roots.length || !form) return renamed;
  form.set(PDFName.of('Fields'), ctx.obj(roots));
  if (fonts.entries().length) form.set(PDFName.of('DR'), ctx.obj({ Font: fonts }));
  if (needAppearances) form.set(PDFName.of('NeedAppearances'), lib.PDFBool.True); // only if a source asked for it
  out.catalog.set(PDFName.of('AcroForm'), ctx.register(form));
  return renamed;
}

// P24 (03/10): split by bookmarks (Sejda, PDF24). The bookmarks down to `maxDepth` (1 = top level) with the page each one
// opens, 0-based, in reading order: [{ title, page, depth }]. A bookmark with no page (a link, a broken destination) is
// skipped; its children are still read. Destinations: explicit arrays, named ones (old /Dests and the /Names tree), GoTo.
export function bookmarkPages(lib, src, maxDepth = 1) {
  const { PDFName, PDFDict, PDFArray, PDFRef, PDFString, PDFHexString, PDFNumber } = lib;
  const N = (x) => PDFName.of(x);
  const outlines = src.catalog.lookupMaybe(N('Outlines'), PDFDict);
  if (!outlines) return [];
  const ctx = src.context;
  const pageIndex = new Map(src.getPages().map((p, i) => [p.ref.tag, i]));
  const named = (name) => {
    const key = name.decodeText();
    const old = src.catalog.lookupMaybe(N('Dests'), PDFDict);
    if (old) { for (const [k, v] of old.entries()) if (k.decodeText() === key) return ctx.lookup(v); }
    const walk = (node, depth) => {
      if (!node || depth > 32) return undefined;
      const names = node.lookupMaybe(N('Names'), PDFArray);
      if (names) for (let i = 0; i + 1 < names.size(); i += 2) {
        const k = names.lookup(i);
        if ((k instanceof PDFString || k instanceof PDFHexString) && k.decodeText() === key) return ctx.lookup(names.get(i + 1));
      }
      const kids = node.lookupMaybe(N('Kids'), PDFArray);
      if (kids) for (let i = 0; i < kids.size(); i++) { const r = walk(kids.lookupMaybe(i, PDFDict), depth + 1); if (r) return r; }
      return undefined;
    };
    return walk(src.catalog.lookupMaybe(N('Names'), PDFDict)?.lookupMaybe(N('Dests'), PDFDict), 0);
  };
  const pageOf = (item) => {
    let d = item.lookup(N('Dest'));
    if (d === undefined) {
      const a = item.lookupMaybe(N('A'), PDFDict);
      if (!a || String(a.get(N('S'))) !== '/GoTo') return undefined;
      d = a.lookup(N('D'));
    }
    if (d instanceof PDFName || d instanceof PDFString || d instanceof PDFHexString) d = named(d);
    if (d instanceof PDFDict) d = d.lookup(N('D'));
    if (!(d instanceof PDFArray) || !d.size()) return undefined;
    const p = d.get(0);
    if (p instanceof PDFRef) return pageIndex.get(p.tag);
    if (p instanceof PDFNumber) { const n = p.asNumber(); return Number.isInteger(n) && n >= 0 && n < pageIndex.size ? n : undefined; }
    return undefined;
  };
  const out = [];
  const seen = new Set();
  const walk = (first, depth) => {
    let ref = first;
    while (ref instanceof PDFRef && !seen.has(ref.tag) && out.length < 5000) {
      seen.add(ref.tag);
      const item = ctx.lookup(ref);
      if (!(item instanceof PDFDict)) break;
      const page = pageOf(item);
      const t = item.lookup(N('Title'));
      const title = (t instanceof PDFString || t instanceof PDFHexString ? t.decodeText() : '').replace(/[\u0000-\u001f]/g, ' ').trim();
      if (page !== undefined) out.push({ title: title || 'Untitled', page, depth });
      if (depth < maxDepth) walk(item.get(N('First')), depth + 1);
      ref = item.get(N('Next'));
    }
  };
  walk(outlines.get(N('First')), 1);
  return out;
}
