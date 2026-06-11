'use client';
import { useState, useRef } from 'react';
export default function ImageMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setMetadata({ name: file.name, size: (file.size/1024).toFixed(2) + ' KB', type: file.type, width: img.width + ' px', height: img.height + ' px', lastModified: new Date(file.lastModified).toLocaleString() });
    };
    img.src = url;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Metadata Viewer</h1>
        <p className="text-neutral-500 text-center mb-8">View image metadata and EXIF data</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={analyze} />
          </div>
          {metadata && <div className="space-y-2">{Object.entries(metadata).map(([k,v]) => <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 capitalize">{k}</span><span className="text-indigo-400 font-mono">{v}</span></div>)}</div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Metadata</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Metadata is a free online tool that extracts and displays detailed information from your photos, including EXIF data, creation date, camera settings, and file properties. Instantly view hidden metadata embedded in your images without downloading software or compromising your privacy.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Metadata</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Metadata tool on your browser and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your image file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait a few seconds for the tool to process and analyze your image file</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>View all extracted metadata information displayed in an organized, easy-to-read format on your screen</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my image data stored on your servers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Image Metadata processes images locally in your browser. Your files are never uploaded to our servers, ensuring complete privacy and security.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does the tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Metadata supports all common image formats including JPG, PNG, GIF, BMP, TIFF, WebP, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I remove metadata from my images?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">While Image Metadata displays metadata, some versions include options to strip or remove sensitive EXIF data before downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why should I check image metadata?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Viewing metadata helps you verify photo authenticity, check camera settings, identify location data, and understand copyright information.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove location data from photos before sharing on social media to protect your privacy and security</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the metadata viewer to verify authentic photos and detect edited or manipulated images</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check camera settings and EXIF data to improve your photography skills and learn from other photographers</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch process multiple images by uploading them one at a time to compare metadata across different photos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}