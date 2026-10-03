// P27: before a PDF goes to ConvertAPI (PDF to Word, RTF, Excel, PowerPoint), accent glyphs that have no Unicode text
// get the accent the PDF itself puts on them in /ActualText (pdf-tools /v1/unicode-from-actualtext; that measured case
// only -- combining marks after a base letter, never right-to-left or reordered scripts, never encrypted or damaged
// files; independent review).
//
// Measured (docs/audit/RAPPORT-p27-nuit-04-10.md §2): a real 3-page LibreOffice PDF draws "é" as "e" + an accent glyph
// without Unicode and carries "é" in /ActualText (420 times); ConvertAPI ignores ActualText and wrote "donne% es" for
// "données" in the DOCX, the .doc and the RTF. The same PDF with the entries added: "données", everywhere. Nothing is
// guessed (every character comes from the document's ActualText), page content is untouched, a code that already has
// text is never changed.
//
// Best effort, by design: when the service is not configured, unreachable, slow or answers anything but a PDF, the
// original bytes go to ConvertAPI exactly as before P27 -- the conversion is never refused or delayed because of this
// step (it has 30 s at most, against the route's 300 s). Files above the service's 50 MB upload limit skip it.
const SERVICE_MAX_BYTES = 50 * 1024 * 1024;

/**
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{ buffer: Buffer, added: number }>}
 */
async function unicodeFromActualText(pdfBuffer) {
  const serviceUrl = process.env.PDFTOOLS_SERVICE_URL;
  const apiKey = process.env.PDFTOOLS_API_KEY;
  if (!serviceUrl || !apiKey || pdfBuffer.length > SERVICE_MAX_BYTES) return { buffer: pdfBuffer, added: 0 };
  try {
    const form = new FormData();
    form.append('file', new Blob([pdfBuffer]), 'input.pdf');
    const res = await fetch(`${serviceUrl.replace(/\/+$/, '')}/v1/unicode-from-actualtext`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status !== 200) return { buffer: pdfBuffer, added: 0 };
    const out = Buffer.from(await res.arrayBuffer());
    if (out.length < 8 || out.subarray(0, 5).toString('latin1') !== '%PDF-') return { buffer: pdfBuffer, added: 0 };
    return { buffer: out, added: Number(res.headers.get('x-unicode-added')) || 0 };
  } catch {
    return { buffer: pdfBuffer, added: 0 };
  }
}

module.exports = { unicodeFromActualText };
