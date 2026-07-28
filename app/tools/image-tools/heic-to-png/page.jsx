'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function HeicToPngPage() {
  const [file, setFile] = useState(null);
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
      const blob = await heic2any({ blob: file, toType: 'image/png' });
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
        <h1 className="text-3xl font-bold text-center mb-2">HEIC to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert iPhone HEIC photos to PNG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a HEIC file here'}</p>
            <input ref={inputRef} type="file" accept=".heic,.heif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PNG'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download={file.name.replace(/\.heic$/i, '.png')} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HEIC to PNG"
        description="HEIC to PNG converts an iPhone HEIC photo to PNG format entirely in your browser, using the open-source heic2any library — your photo is never uploaded to a server."
        howTo={[
          "Click the upload area and select a HEIC or HEIF file from your device.",
          "Click 'Convert to PNG' and wait a few seconds for the conversion to finish.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is HEIC to PNG completely free to use?", a: "Yes, it's 100% free with no account creation required." },
          { q: "What file size limit does HEIC to PNG support?", a: "There's no fixed size limit — conversion happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Do I need to create an account to convert images?", a: "No account is necessary — you can start converting immediately." },
          { q: "Will my uploaded images be kept private?", a: "Yes. Conversion happens entirely in your browser using the heic2any library — your photo is never uploaded to a server." }
        ]}
        tips={[
          "Convert one HEIC file at a time — there's no batch upload option.",
          "Check the converted PNG right after downloading to confirm it looks the way you expect.",
          "Use HEIC to PNG when sharing photos on platforms that don't support Apple's HEIC format natively.",
          "PNG files are larger than HEIC, so expect the output to take up more storage space."
        ]}
      />
    </div>
  );
}