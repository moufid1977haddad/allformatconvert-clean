'use client';
import { useState, useRef } from 'react';

export default function BackgroundRemoverPage() {
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setResult(''); setError(''); };
    reader.readAsDataURL(file);
  };

  const process = async () => {
    if (!preview) return;
    setLoading(true);
    setResult('');
    setError('');
    try {
      const base64 = preview.split(',')[1];
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await response.json();
      if (data.image) setResult('data:image/png;base64,' + data.image);
      else setError(data.error || 'Error removing background');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Background Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove any background instantly with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded-lg" alt="original" /> : <div><p className="text-neutral-400 text-sm">Click to upload an image</p><p className="text-neutral-300 text-xs mt-1">JPG, PNG, WEBP supported</p></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={process} disabled={!preview || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Removing background...' : 'Remove Background'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <label className="block text-sm text-neutral-500">Result</label>
              <div className="rounded-xl overflow-hidden" style={{backgroundImage: 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'}}>
                <img src={result} className="max-h-64 mx-auto" alt="result" />
              </div>
              <a href={result} download="no-background.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PNG</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Background Remover</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Background Remover is a free online tool that instantly removes backgrounds from images using advanced AI technology, allowing you to create transparent PNG files without any software installation. Perfect for product photos, portraits, and professional graphics, this tool delivers clean results in seconds with just a single click.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Background Remover</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Background Remover website and click the 'Upload Image' button to select a photo from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait a few seconds for the AI to automatically detect and remove the background from your image</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview the result and use the adjustment tools to refine edges or restore any removed areas if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click 'Download' to save your transparent PNG image to your computer instantly</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Background Remover completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Background Remover is 100% free with no hidden charges, account creation requirements, or watermarks on your downloaded images.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Background Remover support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool accepts common image formats including JPG, PNG, GIF, and WebP, and outputs results as transparent PNG files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does it take to remove a background?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most images are processed in 2-5 seconds depending on file size and complexity, providing near-instant results.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software or create an account?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Background Remover works entirely online in your browser with no downloads, installations, or account requirements needed.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, use high-resolution images with clear contrast between the subject and background</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Upload images with simple, uniform backgrounds first to get familiar with the tool before processing complex photos</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the manual adjustment tools to fine-tune edges around hair or detailed areas for professional-looking results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your edited images immediately after processing, as online tools may not retain your files permanently</li>
          </ul>
        </div>
      </div>
    </div>
  );
}