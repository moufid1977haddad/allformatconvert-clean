'use client';
import { useState, useRef } from 'react';
export default function ImageToBase64Page() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef();
  const encode = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setResult(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image to Base64</h1>
        <p className="text-neutral-500 text-center mb-8">Convert images to Base64 data URI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName || 'Click or drop an image here'}</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={encode} />
          </div>
          {result && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={result} readOnly /><button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy Base64</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image To Base64</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image to Base64 is a free online tool that converts image files into Base64 encoded text format instantly. This conversion is essential for embedding images directly into HTML, CSS, and JavaScript code without requiring separate image files.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image To Base64</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your image file by clicking the upload button or dragging and dropping an image onto the tool interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your preferred image format if conversion options are available in the tool settings</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Convert button to transform your image into Base64 encoded text</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated Base64 code and paste it into your HTML, CSS, or JavaScript files as needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image to Base64 support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool typically supports all common image formats including PNG, JPG, JPEG, GIF, BMP, WEBP, and SVG files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for the Image to Base64 converter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free online tools support files up to 10-50MB, though larger files may take longer to process. Check your specific tool's limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Base64 images in all browsers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Base64 encoded images are supported by all modern browsers including Chrome, Firefox, Safari, Edge, and Internet Explorer 8 and above.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why would I need to convert an image to Base64?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Base64 conversion is useful for embedding images in emails, reducing HTTP requests, storing images in databases, and including images directly in code without external file dependencies.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Optimize your images before conversion to reduce the Base64 string size and improve page load times significantly</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Base64 encoding for small images and icons; large images are better served as separate files to maintain performance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the entire Base64 string carefully and validate it by testing the image display in your application before deployment</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Consider using data URIs format (data:image/png;base64,) when embedding Base64 images directly into HTML or CSS files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}