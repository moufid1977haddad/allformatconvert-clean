'use client';
import { useState, useRef } from 'react';

export default function PngToIcoPage() {
  const [file, setFile] = useState(null);
  const [size, setSize] = useState(32);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const convert = () => {
    if (!file) return;
    setStatus('Converting...');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(blob => {
        setResult(URL.createObjectURL(blob));
        setStatus('');
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to ICO</h1>
        <p className="text-neutral-500 text-center mb-8">Create favicon ICO from PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PNG file here'}</p>
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Size</label>
            <div className="grid grid-cols-4 gap-2">
              {[16, 32, 48, 64].map(s => (
                <button key={s} onClick={() => setSize(s)} className={`py-2 rounded-lg font-semibold transition ${size === s ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>{s}x{s}</button>
              ))}
            </div>
          </div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to ICO</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done!</div>
              <a href={result} download="favicon.ico" className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download ICO</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Png To Ico</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PNG to ICO is a free online conversion tool that instantly transforms your PNG images into ICO format files for use as website favicons and application icons. Simply upload your PNG file and download your converted ICO file in seconds without any software installation or registration required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Png To Ico</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PNG to ICO converter tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your PNG image file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>The tool automatically converts your PNG to ICO format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your new ICO file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is an ICO file?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">An ICO file is an image format used primarily for website favicons and application icons. It supports multiple resolutions and color depths, making it ideal for displaying small images across different platforms and devices.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PNG to ICO is completely web-based and free. You can convert files directly from your browser without downloading or installing any software on your computer.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for PNG uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool accepts PNG files up to 50MB in size. For most favicon and icon purposes, files are much smaller, so this limit rarely affects users.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple PNG files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can convert multiple PNG files by uploading them one at a time or using our batch conversion feature if available in your account.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results with favicons, use square PNG images with dimensions of 256x256 pixels or larger</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your PNG has a transparent background if you want the ICO file to maintain transparency</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your converted ICO file in your browser to verify it displays correctly as a favicon</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your original PNG file as a backup in case you need to make adjustments and reconvert</li>
          </ul>
        </div>
      </div>
    </div>
  );
}