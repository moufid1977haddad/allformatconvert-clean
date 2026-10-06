'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { detectSignature, extensionOf } from '../../../lib/fileSignature';
import { formatBytes } from '../../../lib/formatBytes';
import { readEmbedded, EMBEDDED_KINDS } from '../../../lib/embeddedMetadata';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function FileMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [warning, setWarning] = useState('');
  const [embedded, setEmbedded] = useState(null); // P24 (03/10): what the file carries inside (lib/embeddedMetadata.js)
  const runRef = useRef(0);
  const inputRef = useRef();
  // The real format is read from the file's first bytes (lib/fileSignature.js, 29/09): `file.type` only
  // reflects the name's extension. A name without a dot has no extension (it used to show the whole name).
  const analyze = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const run = ++runRef.current;
    setEmbedded(null);
    const ext = extensionOf(file.name);
    const head = new Uint8Array(await file.slice(0, 0x8010).arrayBuffer());
    const sig = detectSignature(head);
    const mismatch = sig && !sig.exts.includes(ext);
    setMetadata({
      name: file.name,
      size: file.size,
      extension: ext ? ext.toUpperCase() : '(none)',
      typeFromName: file.type || 'Unknown',
      detectedFromContent: sig ? `${sig.label} (${sig.mime})` : 'Not recognized (text, or a format without a signature)',
      lastModified: new Date(file.lastModified).toLocaleString(),
    });
    readEmbedded(file, sig).then((g) => { if (run === runRef.current) setEmbedded(g); }, () => { if (run === runRef.current) setEmbedded([]); });
    setWarning(mismatch ? `The content is a ${sig.label}, but the name ends in ${ext ? '.' + ext : 'no extension'}${sig.exts[0] ? ` (usually .${sig.exts.filter(Boolean)[0]})` : ''}. Check where this file comes from before opening it.` : '');
  };
  const formatSize = formatBytes;
  const LABELS = { name: 'Name', size: 'Size', extension: 'Extension', typeFromName: 'Type given by the name', detectedFromContent: 'Real format (from content)', lastModified: 'Last modified' };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Metadata</h1>
        <p className="text-neutral-500 text-center mb-8">View file metadata and information</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500"><UploadPrompt what="any file" /></p>
            <input ref={inputRef} type="file" className="hidden" onChange={analyze} />
          </div>
          {warning && <p role="alert" className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">{warning}</p>}
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-neutral-500">{LABELS[k]}</span>
                  <span className="font-mono text-indigo-600 text-right break-all" data-meta={k}>{k === 'size' ? `${formatSize(v)} (${v.toLocaleString()} bytes)` : v}</span>
                </div>
              ))}
            </div>
          )}
          {metadata && embedded === null && <p className="text-sm text-neutral-500">Reading the metadata inside the file…</p>}
          {metadata && embedded && embedded.map(([group, list]) => (
            <div key={group} className="space-y-1" data-embedded={group}>
              <div className="text-sm font-semibold text-neutral-700 mt-2">{group}</div>
              {list.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 bg-neutral-50 rounded-lg border border-neutral-200 p-2 text-sm">
                  <span className="text-neutral-500">{k}</span><span className="font-mono text-indigo-600 text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          ))}
          {metadata && embedded && embedded.length === 0 && <p className="text-sm text-neutral-500">No metadata found inside this file (read for {EMBEDDED_KINDS}).</p>}
        </div>
      </div>
      <SeoContent
        title="File Metadata"
        description="File Metadata shows what a file really is and what it carries. It lists the name, size, extension, the type the browser guesses from the name, the last-modified date and the real format read from the first bytes (46 known signatures), and warns when the content does not match the extension. It then reads the metadata stored inside photos (EXIF, including the GPS position), PDFs, DOCX, XLSX, PPTX and OpenDocument files, ZIP archives and MP3 ID3 tags. It does not show pixel dimensions or media duration, and old .doc, .xls and .ppt files get no inside metadata."
        howToTitle="How to view the metadata of a file"
        howTo={[
          "Choose any file; the rows appear as soon as it is read.",
          "Read the six rows: name, size, extension, type given by the name, real format from the content, and last modified date.",
          "Check the warning, if one appears, that the content does not match the extension.",
          "Scroll to the groups of metadata found inside the file, such as Camera (EXIF) or Location (GPS)."
        ]}
        specs={[
          { label: "Format detection", value: "46 signatures: images, audio, video, documents, archives and more" },
          { label: "Inside metadata", value: "JPEG, PNG, TIFF, HEIC, AVIF and WebP photos (EXIF, GPS, XMP), PDF, DOCX, XLSX, PPTX, OpenDocument, ZIP, MP3 (ID3)" },
          { label: "Not shown", value: "Pixel dimensions, duration, the properties of old .doc, .xls and .ppt files, and PDF or ZIP details of files over 300 MB" },
          { label: "Files", value: "One file per reading; choosing another replaces the result" }
        ]}
        privacy="The file is read by this page through the File API of your browser; it is not uploaded, so a GPS position or an author name found inside stays on your device. Nothing in the file is changed, and no copy of it is kept by the page once you choose another file or leave."
        faqs={[
          { q: "Can it tell if a file was renamed?", a: "Yes. When the first bytes show, say, a Windows program while the name ends in .jpg, a warning names the real format and its usual extension. The type the browser gives cannot do this, because it comes from the name only." },
          { q: "Does it show the GPS location of a photo?", a: "Yes, when the photo stores one: a Location (GPS) group gives latitude and longitude (and altitude when stored), next to the camera, lens and date in Camera (EXIF), for JPEG, PNG, TIFF, HEIC, AVIF and WebP files. Check it before you share a photo." },
          { q: "Does it read Word and Excel properties?", a: "Yes. DOCX, XLSX and PPTX show title, author, last modified by, company, pages or words; OpenDocument files show title, author, dates and generator. No for the older .doc, .xls and .ppt formats: their format is recognized, but their inside properties are not read." },
          { q: "Can it show image dimensions or video length?", a: "No. This tool reads the bytes and the stored properties only. For pixel dimensions, use Image Metadata Viewer, which reads the picture itself; for duration and codecs, use Video Metadata, which reads the video or audio file." }
        ]}
        tips={[
          "A plain text file shows \"Not recognized\" as its real format: text has no signature, so that is normal."
        ]}
      />
    </div>
  );
}