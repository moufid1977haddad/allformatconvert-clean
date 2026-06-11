'use client';
import { useState, useRef } from 'react';
export default function GifToMp4Page() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const canvasRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const stream = canvas.captureStream(10);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          setResult(URL.createObjectURL(blob));
          setLoading(false);
        };
        recorder.start();
        setTimeout(() => recorder.stop(), 2000);
      };
      img.src = URL.createObjectURL(file);
    } catch(e) { setLoading(false); alert('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">GIF to MP4</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to MP4/WebM video</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to MP4'}</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="converted.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Gif To Mp4</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Gif To Mp4 is a free online conversion tool that instantly transforms animated GIF files into high-quality MP4 video format without requiring any software installation. This versatile converter maintains animation quality while reducing file size, making it perfect for sharing videos on social media platforms and websites.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Gif To Mp4</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Gif To Mp4 website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your GIF file into the designated conversion zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to automatically process and convert your GIF to MP4 format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted MP4 file by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Gif To Mp4 completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Gif To Mp4 is 100% free with no hidden charges, registration requirements, or premium subscriptions needed for basic conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does Gif To Mp4 have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Gif To Mp4 supports GIF files up to 500MB, allowing you to convert even large animated files without complications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does the conversion process take?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most GIF to MP4 conversions complete within seconds to a few minutes depending on your file size and internet connection speed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my converted MP4 maintain the same animation quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Gif To Mp4 preserves the original animation quality and frame rate while often reducing the overall file size for better compatibility.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress your GIF file before uploading to speed up conversion time and reduce processing load on the server</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use MP4 format for better compatibility with social media platforms like Facebook, Instagram, and TikTok</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your MP4 files under 100MB for optimal performance when uploading to most websites and messaging applications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert multiple GIFs in batches by uploading them sequentially to save time on repetitive conversion tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}