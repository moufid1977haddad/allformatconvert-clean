'use client';
import { useState, useRef } from 'react';
export default function GifToApngPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = URL.createObjectURL(f);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">GIF to APNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to APNG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PNG</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Gif To Apng</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Gif To Apng is a free online conversion tool that transforms animated GIF files into APNG (Animated Portable Network Graphics) format with superior compression and quality. This web-based utility requires no installation or software downloads, making it the easiest way to convert your animations online.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Gif To Apng</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Gif To Apng website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your GIF file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to process and convert your GIF to APNG format automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your converted APNG file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is APNG and why should I convert GIF to APNG?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">APNG is an improved image format that supports animation with better compression and quality than GIF. It provides smaller file sizes while maintaining superior visual fidelity, making it ideal for web use and modern applications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Gif To Apng completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Gif To Apng is 100% free with no hidden fees, subscriptions, or premium features. You can convert unlimited files without any cost or account registration requirements.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does the tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Gif To Apng accepts GIF files up to 50MB in size. For larger files, you may need to compress or split your animation before uploading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your files are processed locally and automatically deleted after conversion. Gif To Apng does not store or share your uploaded files with any third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Reduce your GIF file size before conversion by optimizing the number of frames and color palette to achieve even smaller APNG files</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your converted APNG files across different browsers and platforms to ensure compatibility with your target audience</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use APNG format for website headers, social media animations, and app interfaces where modern browser support is available</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup of your original GIF file before conversion in case you need to make adjustments or reconvert with different settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}