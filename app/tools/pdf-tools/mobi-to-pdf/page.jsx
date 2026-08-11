'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

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
async function buildChapterHtml({ bodyHtml, cssHrefs, cache }) {
  const doc = new DOMParser().parseFromString(
    `<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`,
    'text/html'
  );

  const images = doc.body.querySelectorAll('img[src^="blob:"]');
  for (const img of images) {
    const src = img.getAttribute('src');
    if (!cache.has(src)) cache.set(src, await blobUrlToDataUri(src));
    img.setAttribute('src', cache.get(src));
  }

  let styleBlock = '';
  for (const cssUrl of cssHrefs) {
    if (!cache.has(cssUrl)) {
      const res = await fetch(cssUrl);
      cache.set(cssUrl, await res.text());
    }
    styleBlock += `<style>${cache.get(cssUrl)}</style>`;
  }

  return styleBlock + doc.body.innerHTML;
}

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
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setError('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setError('');
    setStatus('Parsing MOBI file...');

    let ebook;
    try {
      const mobiParser = await import('@lingo-reader/mobi-parser');
      const arrayBuffer = await file.arrayBuffer();
      ebook = await initEbook(mobiParser, file);

      const metadata = ebook.getMetadata();
      const spine = ebook.getSpine();
      if (!spine.length) throw new Error('No readable chapters found in this file.');

      const cache = new Map();
      const chaptersHtml = [];
      for (let i = 0; i < spine.length; i++) {
        const chapter = ebook.loadChapter(spine[i].id);
        if (!chapter) continue;
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

      const html = buildFullDocument({ title: metadata.title || file.name, coverDataUri, chaptersHtml });

      setStatus('Rendering PDF...');
      const formData = new FormData();
      formData.append('file', new Blob([html], { type: 'text/html' }), 'book.html');

      const res = await fetch('/api/convert-html-to-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        let message = 'Conversion failed. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Response wasn't JSON; fall back to the generic message above.
        }
        throw new Error(message);
      }

      const pdfBlob = await res.blob();
      const filename = (file.name.replace(/\.(mobi|azw3?)$/i, '') || 'document') + '.pdf';
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
        <p className="text-neutral-500 text-center mb-8">Convert MOBI ebooks to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a MOBI file here'}</p>
            <input ref={inputRef} type="file" accept=".mobi,.azw,.azw3" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? (status || 'Converting...') : 'Convert to PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">PDF downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser's downloads for the converted file.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="MOBI to PDF"
        description="MOBI to PDF properly decodes your Kindle ebook's internal PalmDOC or Huffman/CDIC text compression and the newer KF8 structure used by .azw3 files, right in your browser, using the same parsing engine as MOBI to EPUB. The extracted chapters, images, and cover are assembled into a single clean HTML document, which is then uploaded to our conversion service for high-fidelity PDF rendering with a real browser engine — producing a properly paginated PDF with selectable text, rather than a rough print-dialog approximation."
        howTo={[
          "Click the upload area and select a .mobi, .azw, or .azw3 file.",
          "Click \"Convert to PDF\". The file is parsed locally, then the extracted content is uploaded for PDF rendering.",
          "Wait for the download to start automatically.",
          "Open the downloaded PDF to confirm it looks right."
        ]}
        faqs={[
          { q: "Will this reliably convert my MOBI ebook to PDF?", a: "Yes, for unencrypted .mobi, .azw, and .azw3 files. The tool properly decompresses MOBI's PalmDOC or Huffman/CDIC-compressed text and parses the KF8 structure used by most .azw3 files, so chapters, images, and the cover come through correctly, rather than the garbled text a naive byte-to-text approach would produce. DRM-protected ebooks purchased from stores like Amazon can't be converted." },
          { q: "Is MOBI to PDF free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "Partially. Your original MOBI file is parsed entirely in your browser and never uploaded. Only the extracted, cleaned-up HTML (text, images, and cover) is uploaded to our conversion service, purely to render the final PDF with a real browser engine, and it's discarded immediately afterward." },
          { q: "What file types can I upload?", a: ".mobi, .azw, and .azw3 files. The parser automatically detects whether a file uses the older MOBI6 structure or the newer KF8 structure used by most .azw3 files." },
          { q: "Will the text in my PDF be selectable?", a: "Yes. The PDF is rendered from real HTML by a browser engine, not a screenshot, so text stays selectable and searchable." }
        ]}
        tips={[
          "For DRM-protected Kindle purchases, remove the DRM first with a tool you're authorized to use — this converter only handles unencrypted files.",
          "Both .mobi/.azw (MOBI6) and .azw3 (KF8) files are supported, with the internal format detected automatically.",
          "Chapters are separated by page breaks in the resulting PDF for easier navigation.",
          "Very large books may take a little longer to render — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
