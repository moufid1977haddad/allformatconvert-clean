'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function FileMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setMetadata({
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown',
      lastModified: new Date(file.lastModified).toLocaleString(),
      extension: file.name.split('.').pop().toUpperCase(),
    });
  };
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(2) + ' KB';
    return (bytes/(1024*1024)).toFixed(2) + ' MB';
  };
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
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-neutral-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono text-indigo-400">{k === 'size' ? formatSize(v) : v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="File Metadata"
        description="File Metadata is a free online tool that instantly reveals a file's basic properties — name, size, MIME type, last-modified date, and extension — read directly in your browser. Upload any file to see its details in seconds, with nothing ever sent to a server."
        howTo={[
          "Click the upload area and select any file from your device.",
          "The tool reads the file's properties immediately — no extra button to click.",
          "Review the metadata: name, size, type, last modified date, and extension.",
          "Upload a different file at any time to see its metadata instead."
        ]}
        faqs={[
          { q: "Is File Metadata free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can inspect." },
          { q: "What information does it show?", a: "The file's name, size, MIME type, last-modified date, and extension — the standard properties the browser exposes for any file." },
          { q: "Does it show image dimensions or video duration?", a: "Not currently — it only shows the file's basic filesystem-level properties, not embedded metadata like EXIF data, image dimensions, or media duration." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything is read locally via the browser's File API — your file never leaves your device." }
        ]}
        tips={[
          "Check the \"last modified\" date to quickly confirm which version of a file you're looking at.",
          "Use the \"type\" field to verify a file's actual MIME type when the extension alone looks unclear or has been changed.",
          "If the type shows as \"Unknown,\" your browser couldn't detect the MIME type — the file may have an unusual or missing extension.",
          "For deeper metadata like camera EXIF data or image dimensions, you'll need a format-specific metadata tool."
        ]}
      />
    </div>
  );
}