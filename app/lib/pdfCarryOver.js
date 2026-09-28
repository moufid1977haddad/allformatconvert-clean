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
