'use client';
import { useState, useRef } from 'react';
export default function FileMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
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
    </div>
  );
}