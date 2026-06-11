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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About File Metadata</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">File Metadata is a free online tool that instantly extracts and displays detailed information about your files, including size, format, creation date, and other technical properties. Simply upload any file to quickly analyze its metadata without requiring software installation or account creation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use File Metadata</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the File Metadata tool website and locate the upload area on the main page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to process and analyze your file automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>View the complete metadata information displayed in an easy-to-read format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is File Metadata free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, File Metadata is completely free with no hidden charges, subscriptions, or premium features required to access all functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file types does File Metadata support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Metadata supports all common file types including images, documents, videos, audio files, PDFs, spreadsheets, and compressed archives.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my file data secure when using File Metadata?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, files are processed securely and are not stored on our servers after analysis. Your privacy and data security are our top priorities.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What information can I extract from File Metadata?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can view file size, format, creation date, modification date, dimensions (for images/videos), duration (for media), and other technical properties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use File Metadata to verify file information before sharing large files professionally or in business communications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check image metadata to understand photo dimensions and formats before uploading to websites or social media platforms</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Extract document metadata to track file versions and modification history for better document management</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Analyze video and audio file properties to ensure compatibility with your playback devices or editing software before processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}