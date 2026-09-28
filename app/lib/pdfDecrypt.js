// Encrypted PDFs in the pdf-lib tools (29/09).
//
// Measured: ten tools (merge, split, compress, rotate, delete pages, reorder
// pages, number pages, watermark, protect, editor) loaded every PDF with
// pdf-lib's { ignoreEncryption: true }. On an encrypted PDF -- including the
// very common kind that opens WITHOUT a password (only an owner password
// restricting printing or copying: bank statements, invoices, e-books) --
// pdf-lib does not decrypt the content streams, so the output was a broken
// PDF ("Unknown compression method in flate stream", blank pages) delivered
// as a success. Measured on RC4-128 and AES-256 files made with pypdf
// (scripts/converter-tests/10-encrypted-pdf.mjs).
//
// As iLovePDF and Smallpdf do: a PDF that opens without a password is
// decrypted first (with @cantoo/pdf-lib, the pdf-lib fork PDF Unlock already
// uses), then processed normally. A PDF that needs a password to open is
// refused with a clear message pointing to PDF Unlock.

const ENCRYPT = [0x2f, 0x45, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74]; // "/Encrypt"

function mentionsEncrypt(bytes) {
  const n = bytes.length - ENCRYPT.length;
  outer: for (let i = 0; i <= n; i++) {
    if (bytes[i] !== 0x2f) continue;
    for (let j = 1; j < ENCRYPT.length; j++) if (bytes[i + j] !== ENCRYPT[j]) continue outer;
    return true;
  }
  return false;
}

export class PdfNeedsPasswordError extends Error {
  constructor() {
    super('This PDF needs a password to open. Remove the password first with the PDF Unlock tool (you will need it), then use this tool again.');
    this.name = 'PdfNeedsPasswordError';
  }
}

// Returns bytes pdf-lib can process: the input itself when it is not
// encrypted (no copy, no extra work beyond one byte scan), or a decrypted copy.
export async function openablePdfBytes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!mentionsEncrypt(bytes)) return bytes;
  const { PDFDocument } = await import('pdf-lib');
  const probe = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  if (!probe.isEncrypted) return bytes;
  const cantoo = await import('@cantoo/pdf-lib');
  let src;
  try {
    src = await cantoo.PDFDocument.load(bytes, { password: '' });
  } catch {
    throw new PdfNeedsPasswordError();
  }
  // Rebuilt into a new document, as PDF Unlock does, so no /Encrypt
  // dictionary is carried over.
  const out = await cantoo.PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  return out.save();
}
