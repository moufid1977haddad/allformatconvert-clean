'use client';
import { useCallback, useEffect, useState } from 'react';

// A finished file, offered for download when the visitor wants it (28/09). No automatic download at the end of a
// conversion: on an iPhone that saved without asking, or opened a PDF in place of the tool, losing its settings.
// The result's address lives as long as it is shown: freed when it is replaced, cleared, or the page is left.

/** [file, offer(blob, name), clear] — file = { url, name, bytes, type } | null */
export function useDownloadable() {
  const [file, setFile] = useState(null);
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);
  const offer = useCallback((blob, name) => setFile({ url: URL.createObjectURL(blob), name, bytes: blob.size, type: blob.type }), []);
  const clear = useCallback(() => setFile(null), []);
  return [file, offer, clear];
}

const size = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);

/** The Download button (and, for a PDF, a preview in a new tab: the tool page stays open). */
export default function DownloadReady({ file, className = '' }) {
  if (!file) return null;
  const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  return (
    <div className={`space-y-2 ${className}`} data-download-ready>
      <a href={file.url} download={file.name} data-download className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-3 font-semibold transition break-all">
        Download {file.name} ({size(file.bytes)})
      </a>
      {pdf && <a href={file.url} target="_blank" rel="noopener" data-preview className="block text-center text-sm text-indigo-600 underline">Open the PDF in a new tab</a>}
    </div>
  );
}
