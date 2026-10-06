'use client';
import { mobiFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { buildChapterHtml, firstPageShowsCover } from '../../../lib/ebookHtml';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_HTML_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { formatBytes } from '../../../lib/formatBytes';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Fallback cover extraction for classic MOBI6 files where the parser's own
// getCoverImage() comes back empty even though the file legitimately
// declares one. Same approach as MOBI to EPUB: reads the MOBI header fields
// a compliant reader would (firstImageIndex at header offset 108, then EXTH
// record 201 "CoverOffset") directly from the raw bytes.
function extractCoverFallback(arrayBuffer) {
  try {
    const view = new DataView(arrayBuffer);
    const numRecords = view.getUint16(76);
    if (numRecords < 1) return null;

    const recordOffsets = [];
    for (let i = 0; i < numRecords; i++) {
      recordOffsets.push(view.getUint32(78 + i * 8));
    }
    recordOffsets.push(arrayBuffer.byteLength);

    const rec0Start = recordOffsets[0];
    const rec0End = recordOffsets[1];
    if (rec0End - rec0Start < 232) return null;

    const mobiSig = String.fromCharCode(
      view.getUint8(rec0Start + 16), view.getUint8(rec0Start + 17),
      view.getUint8(rec0Start + 18), view.getUint8(rec0Start + 19)
    );
    if (mobiSig !== 'MOBI') return null;

    const mobiHeaderLen = view.getUint32(rec0Start + 20);
    const firstImageIndex = view.getUint32(rec0Start + 108);
    const exthFlags = view.getUint32(rec0Start + 128);
    if (firstImageIndex === 0xFFFFFFFF || !(exthFlags & 0x40)) return null;

    const exthStart = rec0Start + 16 + mobiHeaderLen;
    const exthSig = String.fromCharCode(
      view.getUint8(exthStart), view.getUint8(exthStart + 1),
      view.getUint8(exthStart + 2), view.getUint8(exthStart + 3)
    );
    if (exthSig !== 'EXTH') return null;

    const exthCount = view.getUint32(exthStart + 8);
    let pos = exthStart + 12;
    let coverOffset = null;
    for (let i = 0; i < exthCount; i++) {
      const type = view.getUint32(pos);
      const len = view.getUint32(pos + 4);
      if (type === 201 && len === 12) coverOffset = view.getUint32(pos + 8);
      pos += len;
    }
    if (coverOffset === null) return null;

    const coverIndex = firstImageIndex + coverOffset;
    if (coverIndex < 0 || coverIndex + 1 >= recordOffsets.length) return null;

    const start = recordOffsets[coverIndex];
    const end = recordOffsets[coverIndex + 1];
    const bytes = new Uint8Array(arrayBuffer, start, end - start);
    if (bytes.length < 4) return null;

    let mime = 'image/jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50) mime = 'image/png';
    else if (bytes[0] === 0x47 && bytes[1] === 0x49) mime = 'image/gif';

    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

// .azw3 files use the newer KF8 internal structure rather than classic
// MOBI6, so they need a different parser entry point. The extension is a
// strong signal, but isn't guaranteed, so the other parser is tried as a
// fallback on failure.
async function initEbook({ initMobiFile, initKf8File }, file) {
  const isAzw3 = /\.azw3$/i.test(file.name);
  try {
    return isAzw3 ? await initKf8File(file) : await initMobiFile(file);
  } catch {
    return isAzw3 ? await initMobiFile(file) : await initKf8File(file);
  }
}

// Fetches a blob: URL produced by the mobi parser (image or cover) and
// converts it to a data: URI, so the final HTML sent for PDF rendering is a
// single self-contained file with no external/relative resource references.
async function blobUrlToDataUri(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Turns a chapter's processed HTML (image/stylesheet blob: URLs already
// linked by the mobi parser) into a fragment safe to drop into the combined
// document: images become inline data: URIs and stylesheets become inline
// <style> blocks, both cached by URL so a resource shared across chapters is
// only fetched once.
// buildChapterHtml: app/lib/ebookHtml.js (every blob: address inlined, 29/09).

function buildFullDocument({ title, coverDataUri, chaptersHtml }) {
  const cover = coverDataUri
    ? `<div class="cover"><img src="${coverDataUri}" alt="Cover"/></div>`
    : '';
  const chapters = chaptersHtml
    .map(html => `<div class="chapter">${html}</div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #111; margin: 0; }
  .cover { text-align: center; padding: 40px; page-break-after: always; }
  .cover img { max-width: 100%; max-height: 90vh; }
  .chapter { padding: 40px; page-break-before: always; }
  .chapter:first-child { page-break-before: avoid; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${cover}
${chapters}
</body>
</html>`;
}

export default function MobiToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(0); // P24 review (03/10): chapters that could not be read are counted and said
  const inputRef = useRef();
  const [pdf, offer, clearPdf] = useDownloadable();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setError('');
    setDone(false);
    clearPdf();
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    clearPdf();
    setError('');
    setStatus('Parsing MOBI file...');

    let ebook;
    try {
      // P21 (robustness): a non-MOBI file reached the parser and its raw error ("Offset is outside the bounds of the
      // DataView") was shown as is.
      const problem = await mobiFileProblem(file);
      if (problem) throw new Error(problem);
      const mobiParser = await import('@lingo-reader/mobi-parser');
      const arrayBuffer = await file.arrayBuffer();
      ebook = await initEbook(mobiParser, file);

      const metadata = ebook.getMetadata();
      const spine = ebook.getSpine();
      if (!spine.length) throw new Error('No readable chapters found in this file.');

      const cache = new Map();
      const chaptersHtml = [];
      let skippedCount = 0;
      for (let i = 0; i < spine.length; i++) {
        const chapter = ebook.loadChapter(spine[i].id);
        if (!chapter) { skippedCount++; continue; }
        chaptersHtml.push(await buildChapterHtml({
          bodyHtml: chapter.html,
          cssHrefs: (chapter.css || []).map(c => c.href),
          cache
        }));
      }
      if (!chaptersHtml.length) throw new Error('No readable chapters found in this file.');

      let coverDataUri = null;
      let coverUrl = ebook.getCoverImage();
      if (!coverUrl) {
        const fallbackCover = extractCoverFallback(arrayBuffer);
        if (fallbackCover) coverUrl = URL.createObjectURL(fallbackCover);
      }
      if (coverUrl) coverDataUri = await blobUrlToDataUri(coverUrl);

      // The book's own first page already shows the cover (an EPUB cover page): not added a second time.
      if (firstPageShowsCover(chaptersHtml[0], coverDataUri)) coverDataUri = null;
      const html = buildFullDocument({ title: metadata.title || file.name, coverDataUri, chaptersHtml });

      setStatus('Rendering PDF...');
      const htmlBlob = new Blob([html], { type: 'text/html' });
      // What is uploaded is the prepared HTML (chapters + inlined images), which can be
      // far larger than the book file itself -- so that is what the ceiling applies to.
      if (htmlBlob.size > officeMaxBytes(MAX_HTML_STAGED_BYTES)) {
        throw new Error(`This book is ${formatBytes(htmlBlob.size)} once prepared for conversion (images included), but this tool accepts up to ${officeMaxLabel(MAX_HTML_STAGED_BYTES)}.`);
      }
      setStage(null);
      const result = await convertOffice({ file: new File([htmlBlob], 'book.html', { type: 'text/html' }), endpoint: '/api/convert-html-to-pdf', onStage: setStage });
      const pdfBlob = result.blob;
      const filename = (file.name.replace(/\.(mobi|azw3?)$/i, '') || 'document') + '.pdf';
      offer(pdfBlob, filename);
      setSkipped(skippedCount);
      setDone(true);
      setStatus('');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('');
    } finally {
      if (ebook) ebook.destroy();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">MOBI to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Turn a Kindle MOBI, AZW or AZW3 book into a PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a MOBI file" />}</p>
            <input ref={inputRef} type="file" accept=".mobi,.azw,.azw3" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_HTML_STAGED_BYTES)} of prepared content per book — image-heavy books count for more than their file size.</p>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? (stage ? officeStageLabel(stage) : (status || 'Converting...')) : 'Convert to PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && skipped > 0 && <p className="text-sm text-amber-700 text-center" data-skipped>{skipped} chapter{skipped > 1 ? 's' : ''} of this book could not be read (damaged or in an unsupported form) and {skipped > 1 ? 'are' : 'is'} missing from the PDF.</p>}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">PDF ready</div>
              <DownloadReady file={pdf} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="MOBI to PDF"
        description={`MOBI to PDF converts Kindle ebooks to PDF: the older MOBI format (.mobi, .azw) and the newer KF8 format (.azw3). Your browser decodes it with the same parser as our MOBI to EPUB tool, unpacking the compressed text, the images and the cover. Our Chromium service then prints the decoded chapters, each starting a new page, as a PDF whose text you can select. Books sold with DRM cannot be decoded.`}
        howToTitle="How to convert a Kindle MOBI or AZW3 book to PDF"
        howTo={[
          `Click or drop the Kindle book (.mobi, .azw or .azw3) to turn into pages.`,
          `Click "Convert to PDF"; the button reads "Parsing MOBI file..." while your browser decodes the book.`,
          `When "PDF ready" is shown, "Download" saves the Kindle book as a PDF.`,
        ]}
        specs={[
          { label: 'Input formats', value: `MOBI (.mobi, .azw) and KF8 (.azw3), without DRM` },
          { label: 'Output', value: `One PDF with the cover on its first page when the book has one` },
          { label: 'Size limit', value: `${officeMaxLabel(MAX_HTML_STAGED_BYTES)} of HTML once the book is decoded, images included` },
          { label: 'Usage limits', value: `Decoded books over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB count toward an hourly and a daily limit per network.` },
        ]}
        privacy={`Decoding is done by your browser, and the original MOBI file never leaves it. Our server receives just the HTML made from the book and passes it to our Chromium service for printing. Above ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB, that HTML travels in parts through our media service, which deletes it after printing and discards the PDF once this page has retrieved it, or after a time limit.`}
        faqs={[
          { q: `Can a Kindle book bought from Amazon become a PDF?`, a: `No, not when the book carries DRM, as most purchases do: its text is encrypted and cannot be decoded here. Books without DRM, such as many free titles, convert normally. A file that is not a Kindle book at all is refused with a message.` },
          { q: `Which Kindle formats are accepted?`, a: `Three: .mobi and .azw in the MOBI structure, and .azw3 in the KF8 structure. The tool tries the structure that matches the extension first, then the other one, so a misnamed file can still open. Other Kindle files, such as .prc or .kfx, are not accepted.` },
          { q: `Is the cover included?`, a: `Yes, when the book has one. It is read from the book's data or, failing that, from the cover record in the file header, and becomes the first page unless the first chapter already shows it.` },
        ]}
        tips={[
          `To keep the book reflowable on an e-reader, choose MOBI to EPUB rather than a PDF.`,
        ]}
      />
    </div>
  );
}
