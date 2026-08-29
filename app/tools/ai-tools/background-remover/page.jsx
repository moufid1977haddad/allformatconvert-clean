'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkFileSize, MAX_REMOVEBG_IMAGE_BYTES } from '@/lib/quota/limits';

export default function BackgroundRemoverPage() {
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setResult(''); setError(''); };
    reader.onerror = () => { setPreview(''); setResult(''); setError('Failed to read the image file. It may be corrupt or in an unsupported format.'); };
    reader.readAsDataURL(file);
  };

  const process = async () => {
    if (!preview) return;
    setLoading(true);
    setResult('');
    setError('');
    try {
      const base64 = preview.split(',')[1];
      const sizeCheck = checkFileSize(imageFile, MAX_REMOVEBG_IMAGE_BYTES, 'Images');
      if (!sizeCheck.ok) { setError(sizeCheck.message); setLoading(false); return; }
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, tool: 'background-remover' }),
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
          <button onClick={process} disabled={!preview || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
      <SeoContent
        title="Background Remover"
        description="Background Remover is a free online tool that instantly removes the background from an image using the remove.bg AI image-processing service, giving you a transparent PNG in one click. Perfect for product photos, portraits, and professional graphics, with no software installation required."
        howTo={[
          "Click the upload area and select a photo from your device.",
          "Click 'Remove Background' and wait a few seconds while the background is automatically detected and removed.",
          "Preview the result against the checkered transparency background.",
          "Click 'Download PNG' to save your transparent image to your computer."
        ]}
        faqs={[
          { q: "Is Background Remover completely free to use?", a: "Yes, Background Remover is free to use with no account creation or watermarks on your downloaded image." },
          { q: "What image formats does Background Remover support?", a: "The tool accepts common image formats like JPG and PNG, and always outputs the result as a transparent PNG file." },
          { q: "How long does it take to remove a background?", a: "Most images are processed in a few seconds, depending on file size and complexity." },
          { q: "Do I need to install any software or create an account?", a: "No, Background Remover works entirely online with no downloads, installations, or account requirements." }
        ]}
        tips={[
          "For best results, use images with clear contrast between the subject and background.",
          "Simple, uniform backgrounds are removed more cleanly than busy or low-contrast ones.",
          "If the automatic result isn't clean around fine details like hair, try a higher-resolution source image.",
          "Download your result right after processing, since the image isn't saved on our server."
        ]}
      />
    </div>
  );
}