'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="Image to Base64"
        description="Image to Base64 reads an image file and encodes it as a Base64 data URI, entirely in your browser using the FileReader API — your file is never uploaded to a server. The encoding happens automatically as soon as you select a file, ready to copy."
        howTo={[
          "Click the upload area and select an image file from your device.",
          "The Base64 data URI is generated automatically — there's no separate convert button.",
          "Review the encoded text in the output box.",
          "Click 'Copy Base64' to copy the full data URI to your clipboard."
        ]}
        faqs={[
          { q: "What image formats does Image to Base64 support?", a: "It accepts common formats your browser can open, such as JPG, PNG, GIF, and WebP." },
          { q: "Is there a file size limit for the Image to Base64 converter?", a: "There's no fixed size limit — encoding happens locally, so it's limited only by your device's available memory. Keep in mind large images produce very long Base64 strings." },
          { q: "Can I use Base64 images in all browsers?", a: "Yes, data URIs are supported by all current browsers." },
          { q: "Why would I need to convert an image to Base64?", a: "It's useful for embedding small images directly in HTML, CSS, or JavaScript without a separate file request." }
        ]}
        tips={[
          "Base64 encoding works best for small images and icons — large images produce very long strings that bloat your code.",
          "Compress or resize an image before encoding it if you want a shorter Base64 string.",
          "Paste the full data URI (starting with data:image/...) directly into an src or url() property.",
          "Test the encoded image in your actual application before relying on it, to confirm it renders correctly."
        ]}
      />
    </div>
  );
}