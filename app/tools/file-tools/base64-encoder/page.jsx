'use client';
import { useState, useRef } from 'react';
export default function FileBase64EncoderPage() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const encode = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setResult(reader.result); setLoading(false); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File to Base64</h1>
        <p className="text-neutral-500 text-center mb-8">Convert any file to Base64 encoding</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName || 'Click or drop any file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={encode} />
          </div>
          {loading && <p className="text-center text-neutral-500">Encoding...</p>}
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy Base64</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Base64 Encoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Base64 Encoder is a free online tool that converts text, images, and files into Base64 format for secure data transmission and storage. This essential utility is perfect for developers, web designers, and anyone needing to encode data for APIs, emails, or databases.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Base64 Encoder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field on the Base64 Encoder homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Encode' button to instantly convert your content into Base64 format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Copy the encoded result from the output field using the copy button</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Use the Base64 string in your application, API calls, or database as needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is Base64 encoding used for?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Base64 encoding converts binary data into a text format that can be safely transmitted over text-based protocols like email and HTTP. It's commonly used for encoding images, PDFs, and other files for web applications and APIs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Base64 Encoder tool completely free?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our Base64 Encoder is completely free to use with no registration required. You can encode unlimited amounts of data without any hidden charges or premium restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I encode images and files with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can encode text, images, PDFs, and most file types. Simply paste the content or upload the file, and our tool will convert it to Base64 format instantly.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this online tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our Base64 Encoder processes data client-side in your browser, meaning your information is never sent to our servers. This ensures complete privacy and security for your sensitive data.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Base64 encoding to embed images directly in HTML or CSS, reducing the number of HTTP requests and improving page load times</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always decode Base64 strings to verify their contents before using them in production environments to prevent security issues</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For large files, consider using Base64 encoding in chunks to avoid browser performance issues and memory limitations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a copy of your original data before encoding, as Base64 is encoding not encryption and should not be used for security purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}