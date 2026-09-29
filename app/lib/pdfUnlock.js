// PDF Unlock (audit 2, 29/09).
// Before: the decrypted document was rebuilt by copying its pages into a new PDF, which silently dropped everything
// that is not a page: bookmarks, form fields (the AcroForm, so fields no longer worked), document title/metadata,
// page labels, attachments. iLovePDF and Smallpdf keep them. Now the decrypted document itself is saved, after
// removing what would still mention the old encryption: @cantoo/pdf-lib already drops /Encrypt from the trailer, and
// here every object no longer reachable from the catalog or the Info dictionary (the encryption dictionary, the old
// cross-reference and object streams) is deleted, so no reader flags the file as encrypted.

export async function unlockPdfBytes(bytes, password) {
  const C = await import('@cantoo/pdf-lib');
  const plain = await C.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  if (!plain.isEncrypted) return { bytes: null, wasEncrypted: false };
  const doc = await C.PDFDocument.load(bytes, { password, updateMetadata: false });
  const ctx = doc.context;
  const seen = new Set();
  const stack = [ctx.trailerInfo.Root, ctx.trailerInfo.Info].filter(Boolean);
  while (stack.length) {
    const v = stack.pop();
    if (v instanceof C.PDFRef) {
      if (seen.has(v.tag)) continue;
      seen.add(v.tag);
      const o = ctx.lookup(v);
      if (o) stack.push(o);
    } else if (v instanceof C.PDFDict) {
      for (const [, x] of v.entries()) stack.push(x);
    } else if (v instanceof C.PDFArray) {
      stack.push(...v.asArray());
    } else if (v && v.dict instanceof C.PDFDict) {
      stack.push(v.dict);
    }
  }
  for (const [ref] of ctx.enumerateIndirectObjects()) if (!seen.has(ref.tag)) ctx.delete(ref);
  return { bytes: await doc.save(), wasEncrypted: true };
}
