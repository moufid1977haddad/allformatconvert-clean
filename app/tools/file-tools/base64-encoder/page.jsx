'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function FileBase64EncoderPage() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const encode = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setLoading(true);
    setError('');
    setResult('');
    setFileName(file.name);
    try {
      const reader = new FileReader();
      reader.onload = () => { setResult(reader.result); setLoading(false); };
      reader.onerror = () => { setError('Failed to read file: ' + (reader.error?.message || 'unknown error')); setLoading(false); };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read file: ' + (err?.message || 'unknown error'));
      setLoading(false);
    }
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
          {error && <p className="text-center text-red-400 text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy Base64</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="File to Base64"
        description="File to Base64 is a free online tool that instantly converts any file into a Base64-encoded data URL, right in your browser. Upload a file and get a ready-to-use Base64 string for embedding in HTML, CSS, JSON, or API payloads — nothing is ever uploaded to a server."
        howTo={[
          "Click the upload area and select any file from your device.",
          "The file is encoded to Base64 automatically the moment it's selected — no extra button to click.",
          "Review the encoded string in the output box.",
          "Click \"Copy Base64\" to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is File to Base64 free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can encode." },
          { q: "Is my file uploaded anywhere?", a: "No. The file is read and encoded locally using the browser's FileReader API — it never leaves your device." },
          { q: "What kinds of files can I encode?", a: "Any file type — images, PDFs, documents, and more — one file at a time." },
          { q: "What does the output look like?", a: "A full data URL (data:<mime-type>;base64,<data>) ready to paste into an src attribute, JSON payload, or API call." }
        ]}
        tips={[
          "Use the Base64 output directly as an image or CSS background src to avoid an extra HTTP request for small assets.",
          "Very large files produce very large Base64 strings and can slow down the browser tab — this works best for small to medium files.",
          "Base64 is an encoding, not encryption — don't use it to hide or protect sensitive data.",
          "If you only need the raw Base64 payload, strip the \"data:mime/type;base64,\" prefix from the output."
        ]}
      />
    </div>
  );
}