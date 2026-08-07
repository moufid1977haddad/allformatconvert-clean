'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const IMAGE_EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  bmp: 'image/bmp'
};

// Resolves a relative href against a base file path (e.g. the .opf's own
// path, or a cover wrapper page's path) the same way a browser would resolve
// a relative URL, including '../' segments — used instead of naive string
// concatenation since EPUBs are free to nest their OEBPS content in
// subdirectories.
function resolveEpubPath(basePath, relativeHref) {
  const baseDir = basePath.includes('/') ? basePath.slice(0, basePath.lastIndexOf('/') + 1) : '';
  const resolved = new URL(relativeHref, 'file:///' + baseDir).pathname;
  return decodeURIComponent(resolved.replace(/^\//, ''));
}

// @lingo-reader/epub-parser's own getCoverImage() only follows a legacy
// <guide><reference type="cover"> entry, and treats its href as the image
// itself — but Gutenberg (and many other real-world EPUBs) point that
// reference at a full-page XHTML "cover wrapper" that merely displays the
// image, which the library never unwraps, resulting in an empty blob.
// This resolves the cover directly from the zip, checking (in order) the
// EPUB3 manifest properties="cover-image" item, the EPUB2 <meta name="cover">
// convention, and the <guide> reference — unwrapping an XHTML wrapper page
// to find the <img> it displays if the resolved target isn't already an
// image.
async function extractCoverImage(file, JSZip) {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const opfPath = Object.keys(zip.files).find(f => f.toLowerCase().endsWith('.opf'));
    if (!opfPath) return null;

    const opfXml = await zip.files[opfPath].async('text');
    const doc = new DOMParser().parseFromString(opfXml, 'application/xml');
    const manifestItems = [...doc.querySelectorAll('manifest > item')];

    let coverItem = manifestItems.find(i => (i.getAttribute('properties') || '').split(/\s+/).includes('cover-image'));
    if (!coverItem) {
      const coverId = doc.querySelector('metadata > meta[name="cover"]')?.getAttribute('content');
      if (coverId) coverItem = manifestItems.find(i => i.getAttribute('id') === coverId);
    }

    let coverHref = coverItem?.getAttribute('href');
    if (!coverHref) coverHref = doc.querySelector('guide > reference[type="cover"]')?.getAttribute('href');
    if (!coverHref) return null;

    let coverPath = resolveEpubPath(opfPath, coverHref);
    let entry = zip.files[coverPath];

    if (entry && /\.(x?html?)$/i.test(coverPath)) {
      const wrapperHtml = await entry.async('text');
      const wrapperDoc = new DOMParser().parseFromString(wrapperHtml, 'text/html');
      const imgSrc = wrapperDoc.querySelector('img')?.getAttribute('src');
      if (!imgSrc) return null;
      coverPath = resolveEpubPath(coverPath, imgSrc);
      entry = zip.files[coverPath];
    }
    if (!entry) return null;

    const bytes = await entry.async('uint8array');
    if (!bytes.length) return null;
    const ext = coverPath.split('.').pop().toLowerCase();
    return new Blob([bytes], { type: IMAGE_EXT_TO_MIME[ext] || 'image/jpeg' });
  } catch {
    return null;
  }
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Fetches a blob: URL produced by the epub parser (chapter image) and
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
// linked by the epub parser) into a fragment safe to drop into the combined
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

export default function EpubToPdfPage() {
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
    setStatus('Parsing EPUB file...');

    let ebook;
    try {
      const { initEpubFile } = await import('@lingo-reader/epub-parser');
      ebook = await initEpubFile(file);

      const metadata = ebook.getMetadata();
      const spine = ebook.getSpine();
      if (!spine.length) throw new Error('No readable chapters found in this file.');

      const cache = new Map();
      const chaptersHtml = [];
      for (let i = 0; i < spine.length; i++) {
        const chapter = await ebook.loadChapter(spine[i].id);
        if (!chapter) continue;
        chaptersHtml.push(await buildChapterHtml({
          bodyHtml: chapter.html,
          cssHrefs: (chapter.css || []).map(c => c.href),
          cache
        }));
      }
      if (!chaptersHtml.length) throw new Error('No readable chapters found in this file.');

      let coverDataUri = null;
      const JSZip = (await import('jszip')).default;
      const coverBlob = await extractCoverImage(file, JSZip);
      if (coverBlob) coverDataUri = await blobToDataUri(coverBlob);

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
      const filename = (file.name.replace(/\.epub$/i, '') || 'document') + '.pdf';
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
        <h1 className="text-3xl font-bold text-center mb-2">EPUB to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert EPUB ebooks to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an EPUB file here'}</p>
            <input ref={inputRef} type="file" accept=".epub" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
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
        title="EPUB to PDF"
        description="EPUB to PDF parses your ebook's chapters, images, stylesheets, and cover right in your browser, using a dedicated EPUB parser rather than a naive zip-and-concatenate approach. The extracted content is assembled into a single clean HTML document, which is then uploaded to our conversion service for high-fidelity PDF rendering with a real browser engine — producing a properly paginated PDF with selectable text, rather than a rough print-dialog approximation."
        howTo={[
          "Click the upload area and select an EPUB file.",
          "Click \"Convert to PDF\". The file is parsed locally, then the extracted content is uploaded for PDF rendering.",
          "Wait for the download to start automatically.",
          "Open the downloaded PDF to confirm it looks right."
        ]}
        faqs={[
          { q: "Will this reliably convert my EPUB ebook to PDF?", a: "Yes, for unencrypted, standards-compliant EPUB files. The tool properly parses the EPUB's manifest, chapters, images, and stylesheets, rather than just concatenating raw file contents, so formatting and images come through correctly. DRM-protected EPUBs purchased from some stores can't be converted." },
          { q: "Is EPUB to PDF free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "Partially. Your original EPUB file is parsed entirely in your browser and never uploaded. Only the extracted, cleaned-up HTML (text, images, and cover) is uploaded to our conversion service, purely to render the final PDF with a real browser engine, and it's discarded immediately afterward." },
          { q: "Will images and formatting be preserved?", a: "Yes. Chapter images and stylesheets declared in the EPUB are extracted and embedded directly into the PDF, along with the cover if one is present." },
          { q: "Will the text in my PDF be selectable?", a: "Yes. The PDF is rendered from real HTML by a browser engine, not a screenshot, so text stays selectable and searchable." }
        ]}
        tips={[
          "DRM-protected EPUBs from some stores aren't supported — this converter only handles unencrypted files.",
          "Chapters are separated by page breaks in the resulting PDF for easier navigation.",
          "Very large books may take a little longer to render — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
