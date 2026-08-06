'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function PptToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setError('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setDone(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert-to-pdf', { method: 'POST', body: formData });

      if (!res.ok) {
        let message = 'Conversion failed. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Response wasn't JSON; fall back to the generic message above.
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'presentation') + '.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PowerPoint to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .pptx files to PDF with professional-grade fidelity</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a .pptx file here'}</p>
            <input ref={inputRef} type="file" accept=".pptx" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? 'Converting...' : 'Download PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">PDF downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser's downloads for the converted file.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PowerPoint to PDF"
        description="PowerPoint to PDF converts your .pptx file into a real, professional-quality PDF using LibreOffice, the same conversion engine used by many enterprise document pipelines. Your file is uploaded securely over HTTPS to our conversion service for processing, then deleted immediately afterward — it isn't stored, logged, or kept around. Every slide is rendered with accurate layout, fonts, and images, matching your original presentation far more closely than a browser-rendered approximation ever could."
        howTo={[
          "Click the upload area and select a .pptx file from your device.",
          "Click 'Download PDF'. Your file is uploaded securely for conversion and the PDF downloads automatically once it's ready.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is PowerPoint to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does PowerPoint to PDF support?", a: "Only .pptx files. The older binary .ppt format isn't supported — save your presentation as .pptx first if needed." },
          { q: "Will my presentations be uploaded to a server?", a: "Yes. Your file is uploaded securely over HTTPS to our conversion service, which uses LibreOffice to generate the PDF, and is deleted immediately after conversion — it isn't stored or kept." },
          { q: "Do I need to install any software to use PowerPoint to PDF?", a: "No, it works directly in your web browser." },
          { q: "Will each slide become its own PDF page?", a: "Yes. Each slide in your presentation is rendered as one page in the resulting PDF, in its original order." },
          { q: "Why does this look different from the previous in-browser converter?", a: "This tool now converts presentations server-side with LibreOffice instead of approximating the layout in your browser. The trade-off for uploading your file is significantly better fidelity: accurate fonts, images, transitions rendered as static slides, and layout that closely matches the original presentation." }
        ]}
        tips={[
          "LibreOffice-based conversion preserves fonts, images, and slide layout far more accurately than in-browser rendering.",
          "Each slide becomes one page in the PDF, in its original order.",
          "If your file is a legacy .ppt, open it in PowerPoint and save a copy as .pptx before uploading.",
          "Very large presentations or ones with many embedded media files may take a little longer to convert — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
