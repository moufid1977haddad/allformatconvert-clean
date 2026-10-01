'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { detectSignature, extensionOf } from '../../../lib/fileSignature';
import { formatBytes } from '../../../lib/formatBytes';
export default function FileMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [warning, setWarning] = useState('');
  const inputRef = useRef();
  // The real format is read from the file's first bytes (lib/fileSignature.js, 29/09): `file.type` only
  // reflects the name's extension. A name without a dot has no extension (it used to show the whole name).
  const analyze = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
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
            <p className="text-neutral-500">Click or drop any file here</p>
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
        </div>
      </div>
      <SeoContent
        title="File Metadata"
        description="File Metadata is a free online tool that instantly reveals a file's basic properties — name, size, extension, the type its name suggests, its real format read from its first bytes, and last-modified date — read directly in your browser, and warns when the content does not match the extension (a program renamed photo.jpg, for example). Choose any file to see its details in seconds; the file is never sent to a server."
        howTo={[
          "Click the upload area and select any file from your device.",
          "The tool reads the file's properties immediately — no extra button to click.",
          "Review the metadata: name, size, extension, the type given by the name, the real format read from the content, and last modified date.",
          "Upload a different file at any time to see its metadata instead."
        ]}
        faqs={[
          { q: "Is File Metadata free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can inspect." },
          { q: "What information does it show?", a: "The file's name, size, extension, last-modified date, the MIME type the browser guesses from the name, and the real format detected from the file's first bytes (its signature, or 'magic number'), for about fifty common formats." },
          { q: "Can it tell if a file was renamed?", a: "Yes — when the content is, say, a Windows program but the name ends in .jpg, a warning says so. The browser's own type cannot: it is based on the name only." },
          { q: "Does it show image dimensions or video duration?", a: "Not currently — it only shows the file's basic filesystem-level properties, not embedded metadata like EXIF data, image dimensions, or media duration." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything is read locally via the browser's File API — your file never leaves your device." }
        ]}
        tips={[
          "Check the \"last modified\" date to quickly confirm which version of a file you're looking at.",
          "Trust \"Real format (from content)\" rather than \"Type given by the name\": the latter only repeats what the extension says.",
          "Plain text files (TXT, CSV, JSON, code) have no signature, so their real format shows as not recognized; that is normal.",
          "For deeper metadata like camera EXIF data or image dimensions, you'll need a format-specific metadata tool."
        ]}
      />
    </div>
  );
}