'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

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
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const index = resources.size + 1;
  if (kind === 'style') {
    const path = `styles/style${index}.css`;
    resources.set(url, { path, bytes, mime: 'text/css' });
    return path;
  }
  const ext = IMAGE_EXT_BY_MIME[blob.type] || 'jpg';
  const path = `images/image${index}.${ext}`;
  resources.set(url, { path, bytes, mime: blob.type || 'image/jpeg' });
  return path;
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

  const images = doc.body.querySelectorAll('img[src^="blob:"]');
  for (const img of images) {
    const path = await embedResource(img.getAttribute('src'), resources, 'image');
    img.setAttribute('src', path);
  }

  for (const cssUrl of cssHrefs) {
    const path = await embedResource(cssUrl, resources, 'style');
    const link = doc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', path);
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

function buildNcx({ title, identifier, spineIds }) {
  const points = spineIds.map((id, i) => `    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>Chapter ${i + 1}</text></navLabel>
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

function buildNav({ spineIds }) {
  const items = spineIds.map((id, i) => `      <li><a href="text/${id}.xhtml">Chapter ${i + 1}</a></li>`).join('\n');
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

      for (let i = 0; i < spine.length; i++) {
        const chapter = ebook.loadChapter(spine[i].id);
        if (!chapter) continue;
        const chapterId = `chapter${i + 1}`;
        const xhtml = await buildChapterDocument({
          bodyHtml: chapter.html,
          cssHrefs: (chapter.css || []).map(c => c.href),
          title: `Chapter ${i + 1}`,
          resources
        });
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

      zip.file('OEBPS/nav.xhtml', buildNav({ spineIds }));
      zip.file('OEBPS/toc.ncx', buildNcx({ title: metadata.title, identifier, spineIds }));
      zip.file('OEBPS/content.opf', buildOpf({ metadata, manifestItems, spineIds, coverId, identifier }));

      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
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
        <p className="text-neutral-500 text-center mb-8">Convert MOBI ebooks to EPUB format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a MOBI file here'}</p>
            <input ref={inputRef} type="file" accept=".mobi,.azw,.azw3" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to EPUB'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace(/\.(mobi|azw3?)$/i, '') + '.epub'} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download EPUB</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="MOBI to EPUB"
        description="MOBI to EPUB converts your Kindle ebook into a real, standards-compliant EPUB file entirely in your browser — nothing is uploaded to a server. It properly decodes MOBI's internal PalmDOC or Huffman/CDIC text compression and the newer KF8 structure used by .azw3 files, using a dedicated parser rather than reading the raw bytes as plain text, so chapters, images, and the cover are extracted correctly and packaged into a real ZIP-based EPUB that opens in standard e-reader apps. DRM-protected ebooks aren't supported, since decrypting Kindle DRM is outside the scope of this tool."
        howTo={[
          "Click the upload area and select a .mobi, .azw, or .azw3 file.",
          "Click \"Convert to EPUB\" to parse and repackage the file locally.",
          "Wait for the \"Done!\" message to appear.",
          "Download the resulting EPUB and open it in your e-reader app to confirm it looks right."
        ]}
        faqs={[
          { q: "Will this reliably convert my MOBI ebook to a working EPUB?", a: "Yes, for unencrypted .mobi, .azw, and .azw3 files. The tool properly decompresses MOBI's PalmDOC or Huffman/CDIC-compressed text and parses the KF8 structure used by most .azw3 files, then packages the result into a standards-compliant, ZIP-based EPUB. DRM-protected ebooks purchased from stores like Amazon can't be converted, since removing that encryption isn't something this tool does." },
          { q: "Is MOBI to EPUB free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file types can I upload?", a: ".mobi, .azw, and .azw3 files. The parser automatically detects whether a file uses the older MOBI6 structure or the newer KF8 structure used by most .azw3 files." },
          { q: "Is my file uploaded anywhere?", a: "No. All processing happens locally in your browser — your file is never uploaded to a server." },
          { q: "Will chapter titles and in-book links from the original ebook be preserved?", a: "Chapter content, images, and the cover are preserved in reading order, but chapters are currently labeled generically (Chapter 1, Chapter 2, ...) rather than the book's original per-chapter titles, and internal cross-reference links (like footnotes) aren't guaranteed to remain clickable." }
        ]}
        tips={[
          "For DRM-protected Kindle purchases, remove the DRM first with a tool you're authorized to use — this converter only handles unencrypted files.",
          "Both .mobi/.azw (MOBI6) and .azw3 (KF8) files are supported, with the internal format detected automatically.",
          "Chapters are labeled generically (Chapter 1, Chapter 2, ...) since per-chapter titles aren't exposed by the underlying parser.",
          "Always open the resulting EPUB in your e-reader app to confirm it looks right before deleting your original file."
        ]}
      />
    </div>
  );
}
