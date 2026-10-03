// P26 (E1): PDF to Word as legacy Word 97-2003 .doc. ConvertAPI writes no .doc (none of its 332 converters, P25), so
// the PDF becomes a DOCX exactly as for "Word (.docx)", then this turns that DOCX into .doc with LibreOffice on our
// pdf-tools service (/v1/docx-to-doc) -- what CloudConvert and iLovePDF use for .doc. No provider cost of its own.
//
// Measured (docs/audit/RAPPORT-p26-railway-03-10.md §3): text, pages, tables and pictures identical once reopened in
// Word and LibreOffice for flowing documents, ConvertAPI's own output included; text set in fixed-size text boxes
// can be cut in the old format. countTextBoxes() lets the page say so for the documents that have some.
const JSZip = require('jszip');

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/** Number of text boxes (w:txbxContent) in a DOCX's body; 0 when it can't be read. */
async function countTextBoxes(docxBuffer) {
  try {
    const zip = await JSZip.loadAsync(docxBuffer);
    const xml = await zip.file('word/document.xml')?.async('string');
    return xml ? (xml.match(/<w:txbxContent[\s>]/g) || []).length : 0;
  } catch {
    return 0;
  }
}

/**
 * @param {Buffer} docxBuffer
 * @returns {Promise<{ok: true, buffer: Buffer} | {ok: false, status: number, error: string, reason: string}>}
 */
async function convertDocxToDoc(docxBuffer, timeoutMs = 130_000) {
  const serviceUrl = process.env.PDFTOOLS_SERVICE_URL;
  const apiKey = process.env.PDFTOOLS_API_KEY;
  if (!serviceUrl || !apiKey) return { ok: false, status: 500, error: 'The .doc converter is not configured.', reason: 'not_configured' };
  const form = new FormData();
  form.append('file', new Blob([docxBuffer]), 'document.docx');
  let res;
  try {
    res = await fetch(`${serviceUrl.replace(/\/+$/, '')}/v1/docx-to-doc`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: form,
      // the service allows itself 120 s; the route passes less when the function's own time is running out
      signal: AbortSignal.timeout(Math.max(1_000, timeoutMs)),
    });
  } catch (err) {
    return { ok: false, status: 502, error: 'The .doc converter could not be reached. Try Word (.docx).', reason: err?.name === 'TimeoutError' ? 'timeout' : 'unreachable' };
  }
  if (!res.ok) {
    if (res.status === 413) return { ok: false, status: 413, error: 'This document is too large for the .doc format here. Choose Word (.docx).', reason: 'too_large' };
    return { ok: false, status: 502, error: 'This document could not be converted to .doc. Choose Word (.docx).', reason: `service_${res.status}` };
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 512 || !OLE_MAGIC.every((b, i) => buffer[i] === b)) {
    return { ok: false, status: 502, error: 'The .doc converter returned an unexpected file. Choose Word (.docx).', reason: 'not_doc' };
  }
  return { ok: true, buffer };
}

module.exports = { convertDocxToDoc, countTextBoxes };
