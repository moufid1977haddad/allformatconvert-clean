'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { buildChapterHtml, firstPageShowsCover } from '../../../lib/ebookHtml';
import { dropUnknownSpineItems, loadReadableChapters, zipNameSet } from '../../../lib/epubChapters';
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
async function extractCoverImage(zip) {
  try {
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
// Turns a chapter's processed HTML (image/stylesheet blob: URLs already
// linked by the epub parser) into a fragment safe to drop into the combined
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

export default function EpubToPdfPage() {
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
    setStatus('Parsing EPUB file...');

    let ebook;
    try {
      // P21 (robustness): the parser was handed an empty or non-EPUB file, threw inside a promise of its own and never
      // answered ("Parsing EPUB file..." forever). An EPUB is a ZIP package: checked first, and the parsing bounded.
      if (!file.size) throw new Error('This file is empty (0 bytes). Choose the EPUB again.');
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      if (!(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) throw new Error('This is not an EPUB book: an EPUB is a ZIP package, and this file is not one. It may be damaged, or another kind of file renamed .epub.');
      // P37 follow-up: spine entries naming no manifest item stopped the parser with a raw TypeError; they are taken
      // out of the package first and counted with the other missing chapters (app/lib/epubChapters.js).
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => { throw new Error('This EPUB could not be read (its contents are damaged or not standard).'); });
      const unknownItems = await dropUnknownSpineItems(zip);
      if (unknownItems.removed && !unknownItems.kept) throw new Error('No readable chapters found in this file.');
      const bookFile = unknownItems.removed ? new File([await zip.generateAsync({ type: 'uint8array' })], file.name, { type: 'application/epub+zip' }) : file;
      const { initEpubFile } = await import('@lingo-reader/epub-parser');
      ebook = await Promise.race([
        initEpubFile(bookFile),
        new Promise((_, reject) => setTimeout(() => reject(new Error('This EPUB could not be read (its contents are damaged or not standard).')), 60000)),
      ]);

      const metadata = ebook.getMetadata();
      const spine = ebook.getSpine();
      if (!spine.length) throw new Error('No readable chapters found in this file.');

      // P37: a chapter file missing from the book (it came out as a blank page) or that cannot be read (it stopped the
      // whole book) is left out and counted; the page then says how many are missing (app/lib/epubChapters.js).
      const cache = new Map();
      const { chaptersHtml, skipped: unreadable } = await loadReadableChapters({
        ebook,
        spine,
        zipNames: zipNameSet(Object.keys(zip.files)),
        build: (chapter) => buildChapterHtml({
          bodyHtml: chapter.html,
          cssHrefs: (chapter.css || []).map(c => c.href),
          cache
        }),
      });
      if (!chaptersHtml.length) throw new Error('No readable chapters found in this file.');
      const skippedCount = unreadable + unknownItems.removed;

      let coverDataUri = null;
      const coverBlob = await extractCoverImage(zip);
      if (coverBlob) coverDataUri = await blobToDataUri(coverBlob);

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
      const filename = (file.name.replace(/\.epub$/i, '') || 'document') + '.pdf';
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
        <h1 className="text-3xl font-bold text-center mb-2">EPUB to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Print a DRM-free EPUB ebook as a PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="an EPUB file" />}</p>
            <input ref={inputRef} type="file" accept=".epub" className="hidden" onChange={handleFile} />
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
        title="EPUB to PDF"
        description={`EPUB to PDF turns an .epub ebook into a PDF you can print or read on any PDF viewer. Your browser opens the book and collects its chapters in reading order, with their images, style sheets and embedded fonts (obfuscated fonts excepted), plus the cover. That material is assembled into one HTML document and printed by our Chromium service, with selectable text and each chapter starting on a new page. Text without a font of its own is set in a serif face. Books protected by DRM cannot be opened.`}
        howToTitle="How to convert an EPUB to PDF"
        howTo={[
          `Click or drop the DRM-free ebook (.epub) you want to print.`,
          `Click "Convert to PDF": the button shows "Parsing EPUB file..." while your browser reads the book, then "Rendering PDF..." or, for a large book, the upload and conversion progress.`,
          `When "PDF ready" appears, click "Download" to save the book as a PDF.`,
        ]}
        specs={[
          { label: 'Input format', value: `EPUB (.epub) without DRM` },
          { label: 'Output', value: `One PDF, cover first when the book has one` },
          { label: 'Size limit', value: `${officeMaxLabel(MAX_HTML_STAGED_BYTES)} of prepared content (text plus embedded images), which can be larger than the .epub itself` },
          { label: 'Reading time', value: `The book must open within 60 seconds` },
          { label: 'Usage limits', value: `Prepared content over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB counts toward a limit per network per hour and per day.` },
        ]}
        privacy={`The original EPUB file stays in your browser. Our server receives only the HTML your browser built from it, with the text, images, style sheets and cover, and our Chromium service prints that HTML. When it exceeds ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB, it is uploaded in parts to our media service, which removes it after printing and deletes the PDF when this page has received it, or after a time limit.`}
        faqs={[
          { q: `Can I convert an EPUB with DRM?`, a: `No. The chapters of a DRM-protected book are encrypted, and this tool has no way to decrypt them. Books without DRM, such as public-domain titles or files you exported yourself, convert as described above.` },
          { q: `Will the images and the cover be in the PDF?`, a: `Yes. Chapter images, pictures set in style sheets and SVG cover pages are embedded in the HTML before printing. The cover is added as the first page unless the book's first page already shows the same cover image.` },
          { q: `Does the PDF include every chapter?`, a: `Yes, when the book is intact. A chapter whose file is missing or damaged, or whose entry in the reading order points to nothing in the book, is left out, and the page then says how many chapters are missing from the PDF. A book whose package cannot be opened stops with an error message instead.` },
          { q: `Is there a size limit?`, a: `${officeMaxLabel(MAX_HTML_STAGED_BYTES)} of prepared content. Images are counted after they are embedded in the HTML, so an image-heavy book can reach the limit even when the .epub is much smaller; the page then states the prepared size.` },
        ]}
        tips={[
          `Have a Kindle file instead? Use MOBI to PDF; this page only accepts .epub.`,
        ]}
      />
    </div>
  );
}
