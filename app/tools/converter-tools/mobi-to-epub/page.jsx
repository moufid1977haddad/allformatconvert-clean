'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { FileDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const escapeXml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const IMAGE_EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/bmp': 'bmp'
};

// Fallback cover extraction for classic MOBI6 files where the parser's own
// getCoverImage() comes back empty even though the file legitimately
// declares one. Verified against a real-world file (a Project Gutenberg
// MOBI) where getCoverImage() returned '' despite the file containing a
// correctly-declared, valid 231KB JPEG cover: this reads the same MOBI
// header fields a compliant reader would (firstImageIndex at header offset
// 108, then EXTH record 201 "CoverOffset") directly from the raw bytes to
// locate and extract that image ourselves.
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

// Fetches a blob: URL produced by the mobi parser (for an image, stylesheet,
// or cover) and registers it once in `resources`, keyed by the blob URL, so
// the same resource referenced from multiple chapters is only embedded a
// single time in the EPUB.
async function embedResource(url, resources, kind) {
  if (resources.has(url)) return resources.get(url).path;
  const res = await fetch(url);
  const blob = await res.blob();
  let bytes = new Uint8Array(await blob.arrayBuffer());
  const index = resources.size + 1;
  if (kind === 'style') {
    const path = `styles/style${index}.css`;
    resources.set(url, { path, bytes, mime: 'text/css' }); // reserved before the url() inside are embedded
    // Images and fonts a stylesheet points to (url(blob:...)) are embedded, relative to styles/.
    const css = new TextDecoder().decode(bytes);
    if (css.includes('blob:')) resources.get(url).bytes = new TextEncoder().encode(await rewriteCssUrls(css, resources, '../'));
    return path;
  }
  const ext = IMAGE_EXT_BY_MIME[blob.type] || 'jpg';
  const path = `images/image${index}.${ext}`;
  resources.set(url, { path, bytes, mime: blob.type || 'image/jpeg' });
  return path;
}

const CSS_BLOB_URL = /url\(\s*(['"]?)(blob:[^'")\s]+)\1\s*\)/g;
async function rewriteCssUrls(css, resources, prefix) {
  for (const u of new Set([...css.matchAll(CSS_BLOB_URL)].map((m) => m[2]))) await embedResource(u, resources, 'image');
  return css.replace(CSS_BLOB_URL, (_, q, u) => `url("${prefix}${resources.get(u).path}")`);
}

// Turns a chapter's processed HTML (already resource-linked to blob: URLs by
// the mobi parser) into a well-formed XHTML document: image src="blob:..."
// and stylesheet blob URLs are embedded as real files and rewritten to
// relative paths, and the whole thing is round-tripped through DOMParser /
// XMLSerializer so any HTML5-only markup the source MOBI content contains
// (unclosed tags, unescaped entities) comes out as valid XML.
async function buildChapterDocument({ bodyHtml, cssHrefs, title, resources }) {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${bodyHtml}</body></html>`;
  const doc = new DOMParser().parseFromString(raw, 'text/html');

  // Chapters live in OEBPS/text/ and resources in OEBPS/images/ and OEBPS/styles/: references need "../"
  // (29/09: they were written "images/x.jpg", i.e. OEBPS/text/images/x.jpg, so every picture and stylesheet of the
  // EPUB was missing). SVG <image> and url(blob:) in style attributes are embedded too.
  const images = doc.body.querySelectorAll('img[src^="blob:"]');
  for (const img of images) {
    const path = await embedResource(img.getAttribute('src'), resources, 'image');
    img.setAttribute('src', '../' + path);
  }
  for (const im of doc.body.querySelectorAll('image')) {
    for (const attr of ['href', 'xlink:href']) {
      const v = im.getAttribute(attr);
      if (v && v.startsWith('blob:')) im.setAttribute(attr, '../' + await embedResource(v, resources, 'image'));
    }
  }
  for (const el of doc.body.querySelectorAll('[style*="blob:"]')) el.setAttribute('style', await rewriteCssUrls(el.getAttribute('style'), resources, '../'));

  for (const cssUrl of cssHrefs) {
    const path = await embedResource(cssUrl, resources, 'style');
    const link = doc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', '../' + path);
    doc.head.appendChild(link);
  }

  const titleEl = doc.createElement('title');
  titleEl.textContent = title;
  doc.head.insertBefore(titleEl, doc.head.firstChild);
  doc.documentElement.setAttribute('xmlns', XHTML_NS);

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(doc.documentElement);
}

function buildOpf({ metadata, manifestItems, spineIds, coverId, identifier }) {
  const authors = (metadata.author || []).filter(Boolean).map(a => `    <dc:creator>${escapeXml(a)}</dc:creator>`).join('\n');
  const publisher = metadata.publisher ? `    <dc:publisher>${escapeXml(metadata.publisher)}</dc:publisher>` : '';
  const description = metadata.description ? `    <dc:description>${escapeXml(metadata.description)}</dc:description>` : '';
  const coverMeta = coverId ? `    <meta name="cover" content="${coverId}"/>` : '';
  const manifest = manifestItems.map(i =>
    `    <item id="${i.id}" href="${i.href}" media-type="${i.mediaType}"${i.properties ? ` properties="${i.properties}"` : ''}/>`
  ).join('\n');
  const spine = spineIds.map(id => `    <itemref idref="${id}"/>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(metadata.title || 'Untitled')}</dc:title>
    <dc:language>${escapeXml(metadata.language || 'en')}</dc:language>
${authors}
${publisher}
${description}
${coverMeta}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifest}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>`;
}

function buildNcx({ title, identifier, spineIds, titles = [] }) {
  const points = spineIds.map((id, i) => `    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(titles[i] || `Chapter ${i + 1}`)}</text></navLabel>
      <content src="text/${id}.xhtml"/>
    </navPoint>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(identifier)}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(title || 'Untitled')}</text></docTitle>
  <navMap>
${points}
  </navMap>
</ncx>`;
}

function buildNav({ spineIds, titles = [] }) {
  const items = spineIds.map((id, i) => `      <li><a href="text/${id}.xhtml">${escapeXml(titles[i] || `Chapter ${i + 1}`)}</a></li>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="${XHTML_NS}" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="utf-8"/><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
}

// .azw3 files use the newer KF8 internal structure rather than classic
// MOBI6, so they need a different parser entry point. The extension is a
// strong signal, but isn't guaranteed (some .mobi exports are KF8-only and
// vice versa), so the other parser is tried as a fallback on failure.
async function initEbook({ initMobiFile, initKf8File }, file) {
  const isAzw3 = /\.azw3$/i.test(file.name);
  try {
    return isAzw3 ? await initKf8File(file) : await initMobiFile(file);
  } catch {
    return isAzw3 ? await initMobiFile(file) : await initKf8File(file);
  }
}

export default function MobiToEpubPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    e.target.value = '';
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);

    let ebook;
    try {
      const [mobiParser, JSZipModule] = await Promise.all([
        import('@lingo-reader/mobi-parser'),
        import('jszip')
      ]);
      const JSZip = JSZipModule.default;

      const arrayBuffer = await file.arrayBuffer();
      ebook = await initEbook(mobiParser, file);

      const metadata = ebook.getMetadata();
      const spine = ebook.getSpine();
      if (!spine.length) throw new Error('No readable chapters found in this file.');

      const identifier = metadata.identifier || ('urn:uuid:' + crypto.randomUUID());
      const resources = new Map();
      const manifestItems = [];
      const spineIds = [];

      // Chapter titles from the book's own table of contents (29/09: every entry was "Chapter N", Calibre keeps them).
      const labels = new Map();
      const walk = (items) => (items || []).forEach((t) => {
        const r = t.href && ebook.resolveHref ? ebook.resolveHref(t.href) : null;
        if (r && r.id && t.label && !labels.has(r.id)) labels.set(r.id, t.label.trim());
        walk(t.children);
      });
      try { walk(ebook.getToc ? ebook.getToc() : []); } catch { /* no usable table of contents: numbered titles */ }
      const titles = [];

      for (let i = 0; i < spine.length; i++) {
        const chapter = ebook.loadChapter(spine[i].id);
        if (!chapter) continue;
        const chapterId = `chapter${i + 1}`;
        const xhtml = await buildChapterDocument({
          bodyHtml: chapter.html,
          cssHrefs: (chapter.css || []).map(c => c.href),
          title: labels.get(spine[i].id) || `Chapter ${i + 1}`,
          resources
        });
        titles.push(labels.get(spine[i].id) || `Chapter ${i + 1}`);
        manifestItems.push({ id: chapterId, href: `text/${chapterId}.xhtml`, mediaType: 'application/xhtml+xml' });
        spineIds.push(chapterId);
        resources.set(`__chapter_xhtml_${chapterId}`, { path: `text/${chapterId}.xhtml`, xhtml, isChapter: true });
      }

      let coverId = null;
      let coverUrl = ebook.getCoverImage();
      if (!coverUrl) {
        const fallbackCover = extractCoverFallback(arrayBuffer);
        if (fallbackCover) coverUrl = URL.createObjectURL(fallbackCover);
      }
      if (coverUrl) {
        await embedResource(coverUrl, resources, 'image');
      }

      const zip = new JSZip();
      // The EPUB mimetype entry must be the first file in the archive and
      // stored uncompressed, per the OCF spec, for readers that identify an
      // EPUB by sniffing the raw zip bytes rather than trusting the
      // extension.
      zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
      zip.file('META-INF/container.xml', CONTAINER_XML);

      for (const [key, res] of resources) {
        if (res.isChapter) {
          zip.file(`OEBPS/${res.path}`, res.xhtml);
          continue;
        }
        zip.file(`OEBPS/${res.path}`, res.bytes);
        const id = 'res-' + res.path.replace(/[/.]/g, '-');
        const isCover = key === coverUrl;
        manifestItems.push({ id, href: res.path, mediaType: res.mime, properties: isCover ? 'cover-image' : undefined });
        if (isCover) coverId = id;
      }

      zip.file('OEBPS/nav.xhtml', buildNav({ spineIds, titles }));
      zip.file('OEBPS/toc.ncx', buildNcx({ title: metadata.title, identifier, spineIds, titles }));
      zip.file('OEBPS/content.opf', buildOpf({ metadata, manifestItems, spineIds, coverId, identifier }));

      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
    } finally {
      if (ebook) ebook.destroy();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">MOBI to EPUB</h1>
        <p className="text-neutral-500 text-center mb-8">Convert DRM-free MOBI, AZW, AZW3 and PRC ebooks to EPUB</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a MOBI, AZW, AZW3 or PRC file" />}</p>
            <input ref={inputRef} type="file" accept=".mobi,.azw,.azw3,.prc" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to EPUB'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.(mobi|azw3?|prc)$/i, '') + '.epub'} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="MOBI to EPUB"
        description={`MOBI to EPUB reads a Kindle-format ebook — .mobi, .azw, .azw3 or .prc — and repackages it as an EPUB 3 file with a nav page and an NCX table of contents. It copies the chapters in reading order with their images and stylesheets, the cover, and the title, authors, publisher, description and language. It does not remove DRM and does not detect it either, so a protected file may fail or come out unreadable. Links between chapters, such as footnote links, are left as they were. The ebook is unpacked and zipped again by the page itself, so even a long book never travels to a server.`}
        howToTitle="How to convert MOBI to EPUB"
        howTo={[
          'Click the dashed box, or drop the file on it, and choose one .mobi, .azw, .azw3 or .prc ebook.',
          `Press "Convert to EPUB".`,
          `When "Done!" appears, the result row gives the .epub name, taken from your ebook, and its size; "Download" saves it.`,
          `On a device that can share files, "Save / Share" hands the EPUB straight to another app instead.`,
        ]}
        specs={[
          { label: 'Input formats', value: '.mobi, .azw, .azw3 and .prc without DRM, in the MOBI6 or KF8 layout, with PalmDOC or Huffman/CDIC text compression' },
          { label: 'Output', value: 'One EPUB 3 file (.epub): OPF package, nav page, NCX table of contents, images and stylesheets' },
          { label: 'Files at once', value: 'One' },
          { label: 'Maximum file size', value: 'None set by the page; the whole ebook is held in your device memory while it is converted' },
          { label: 'Not converted', value: 'DRM-protected books (not detected); links between chapters are not rewritten' },
        ]}
        privacyTitle="Where your ebook is processed"
        privacy="The ebook is opened by a JavaScript MOBI reader and zipped into the EPUB by your browser: the file and its text are not uploaded. If the conversion fails, the cleaned error message, the tool's name and your browser's name and major version are sent to our error log, without the book or its file name."
        faqs={[
          { q: 'Can I convert Kindle books bought from a store?', a: 'No, not if they carry DRM. The converter neither removes nor checks for encryption, so a protected file may stop with an error or give an unreadable EPUB. It is meant for DRM-free files, such as ebooks you made yourself or downloaded from a free library.' },
          { q: 'Will the EPUB keep the chapters, images and cover?', a: 'Yes. Chapters keep their reading order, images and stylesheets are embedded, and the cover is copied, read straight from the EXTH record of a MOBI6 file when the reader library misses it. Chapter titles come from the book\'s own table of contents, or are numbered Chapter 1, Chapter 2 when it has none.' },
          { q: 'Does it work with AZW3 files?', a: 'Yes. A .azw3 file is read with the KF8 reader first, and a .mobi, .azw or .prc file with the MOBI6 reader; if that reader fails, the other one is tried. Text compressed with PalmDOC or Huffman/CDIC is decoded.' },
          { q: 'Will an EPUB validator accept the file?', a: 'No, not without a warning or error. The package is EPUB 3 with the mimetype entry first, a nav page and an NCX table of contents, but it has no dcterms:modified date, which EPUB 3 requires, and the language can be written as unknown. Open the result in your reading app before deleting the original.' },
          { q: 'Do footnote links still work?', a: 'No, not reliably. The footnote text stays where the original put it, but links that jump between chapters keep their Kindle targets and are not rewritten for the EPUB, so some of them lead nowhere.' },
        ]}
        tips={[
          'Want a PDF to print or annotate instead? MOBI to PDF reads the same .mobi, .azw and .azw3 files, but not .prc.',
        ]}
      />
    </div>
  );
}
