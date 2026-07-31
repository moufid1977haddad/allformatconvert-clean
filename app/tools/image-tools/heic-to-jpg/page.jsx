'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function HeicToJpgPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(85);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    try {
      const heic2any = (await import('heic2any')).default;
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality / 100,
      });
      const url = URL.createObjectURL(blob);
      setResult(url);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HEIC to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert iPhone HEIC photos to JPG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a HEIC file here'}</p>
            <input ref={inputRef} type="file" accept=".heic,.heif" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label>
            <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to JPG'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download={file.name.replace(/\.hei[cf]$/i, '.jpg')} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download JPG</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HEIC to JPG"
        description="HEIC to JPG converts an iPhone HEIC photo to standard JPG format entirely in your browser, using the open-source heic2any library — your photo is never uploaded to a server. Choose a JPEG quality level before converting to balance file size and image quality."
        howTo={[
          "Click the upload area and select a HEIC or HEIF file from your device.",
          "Adjust the quality slider (10–100%) to set the JPEG output quality.",
          "Click 'Convert to JPG' and wait a few seconds for the conversion to finish.",
          "Click the download button to save your JPG file."
        ]}
        faqs={[
          { q: "Is HEIC to JPG completely free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Can I convert multiple HEIC files at once?", a: "No, only one file can be converted at a time — there's no batch upload." },
          { q: "Will my image quality be reduced during conversion?", a: "Some quality loss is expected since JPEG uses lossy compression — use a higher quality setting on the slider to minimize it." },
          { q: "Do I need to install any software?", a: "No, conversion happens directly in your browser without any downloads or installations, and your photo never leaves your device." }
        ]}
        tips={[
          "Use a quality setting of 85% or higher if you plan to print or edit the photo further.",
          "Lower the quality slider for smaller file sizes if you're just sharing the photo online.",
          "Convert HEIC photos to JPG before sharing with people on devices or apps that don't support Apple's HEIC format.",
          "Check the converted JPG immediately after downloading to confirm it looks the way you expect."
        ]}
      />
    </div>
  );
}