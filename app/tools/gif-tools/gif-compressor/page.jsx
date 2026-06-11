'use client';
import { useState, useRef } from 'react';
export default function GifCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const compress = async () => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        setResult({ url: URL.createObjectURL(blob), originalSize: file.size, newSize: blob.size });
      }, 'image/png', quality / 100);
    };
    img.src = url;
  };

  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress GIF files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compress</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Saved</div><div className="font-bold text-green-400">{Math.round((1-result.newSize/result.originalSize)*100)}%</div></div>
              </div>
              <a href={result.url} download="compressed.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Gif Compressor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Gif Compressor is a free online tool that reduces GIF file sizes without sacrificing quality, making it easier to share animations across web and social media platforms. Simply upload your GIF, adjust compression settings, and download your optimized file instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Gif Compressor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Gif Compressor website and click the upload button to select your GIF file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired compression level using the slider or preset options to balance quality and file size</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview the compressed result to ensure it meets your quality standards before downloading</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your compressed GIF to your computer</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Gif Compressor support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Gif Compressor primarily works with GIF files, but some versions may support other animation formats like WebP and APNG.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free versions support files up to 100-200MB, though limits may vary depending on your browser and internet connection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will compression affect the animation quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Compression may reduce color depth and frame quality slightly, but you can adjust settings to find the best balance for your needs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my uploaded GIF files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Gif Compressor processes files locally in your browser and doesn't store your uploads on our servers for privacy protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with medium compression settings and preview the results before trying higher compression for better quality control</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Reduce the number of colors in your GIF to achieve smaller file sizes while maintaining visual appeal</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove unnecessary frames or reduce frame duration to decrease file size without losing animation smoothness</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your compressed GIF across different platforms before finalizing to ensure compatibility and quality on your intended platform</li>
          </ul>
        </div>
      </div>
    </div>
  );
}