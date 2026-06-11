'use client';
import { useState, useRef } from 'react';

export default function HeicToJpgPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(85);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    try {
      const heic2any = (await import('heic2any')).default;
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality / 100,
      });
      const url = URL.createObjectURL(blob);
      setResult(url);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HEIC to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert iPhone HEIC photos to JPG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a HEIC file here'}</p>
            <input ref={inputRef} type="file" accept=".heic,.heif" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label>
            <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to JPG'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download={file.name.replace(/\.heic$/i, '.jpg')} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download JPG</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Heic To Jpg</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Heic To Jpg is a free online conversion tool that instantly transforms HEIC image files to JPG format without requiring any software installation. This web-based converter maintains high image quality while making your photos compatible with all devices and platforms.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Heic To Jpg</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Heic To Jpg website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your HEIC image file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the conversion process to complete automatically, which typically takes just a few seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted JPG file by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Heic To Jpg completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Heic To Jpg is completely free with no hidden charges, registration requirements, or premium features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple HEIC files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool supports batch conversion, allowing you to upload and convert multiple HEIC files simultaneously.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my image quality be reduced during conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Heic To Jpg maintains the original image quality and resolution during the conversion process.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Heic To Jpg is a web-based tool that works directly in your browser without any downloads or installations.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch upload multiple HEIC files to save time if you need to convert several images at once</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your internet connection is stable for faster and more reliable conversions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the output quality immediately after conversion to verify the JPG meets your requirements</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use JPG format for better compatibility when sharing images across different devices and social media platforms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}