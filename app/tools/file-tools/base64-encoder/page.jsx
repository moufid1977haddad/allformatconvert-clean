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
    </div>
  );
}