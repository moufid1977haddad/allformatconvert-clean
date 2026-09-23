'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { MAX_PDF_TO_WORD_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';

// Same pipeline as PDF to Word (ConvertAPI, staged upload for large files) -- lib/pdfToOfficeRoute.ts.
export default function PdfToPptPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    const sizeCheck = checkOfficeSize(f, MAX_PDF_TO_WORD_STAGED_BYTES);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file, MAX_PDF_TO_WORD_STAGED_BYTES);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);
    try {
      setStage(null);
      const result = await convertOffice({ file, endpoint: '/api/pdf-to-ppt', onStage: setStage });
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (file.name.replace(/.[^.]+$/, '') || 'document') + '.pptx';
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
        <h1 className="text-3xl font-bold text-center mb-2">PDF to PowerPoint</h1>
        <p className="text-neutral-500 text-center mb-8">Turn each page of a PDF into an editable PowerPoint slide</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click to choose a PDF'}</p>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file</p>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes(MAX_PDF_TO_WORD_STAGED_BYTES)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
            {loading ? officeStageLabel(stage) : 'Download .pptx'}
          </button>
          {error && <p className="text-center text-red-600 text-sm" role="alert">{error}</p>}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-700 text-xl font-bold mb-1">PowerPoint file downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser&apos;s downloads for the converted file.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to PowerPoint"
        description="PDF to PowerPoint converts every page of your PDF into a slide of an editable .pptx presentation, with text and images you can move and change. The conversion is done by ConvertAPI, the same provider as our PDF to Word tool; your file is sent over HTTPS and deleted after conversion."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Download .pptx'. Your file is uploaded securely for conversion and the PowerPoint file downloads once it's ready.",
          "Open the .pptx file in PowerPoint or a compatible app and check the result."
        ]}
        faqs={[
          { q: "Is PDF to PowerPoint free to use?", a: "Yes, it's free with no signup required." },
          { q: "Will my PDF be uploaded to a server?", a: "Yes. Your file is sent over HTTPS to our conversion provider (ConvertAPI) to create the PowerPoint file, and deleted afterwards — it isn't stored." },
          { q: "What does the output contain?", a: "A .pptx presentation with one slide per PDF page; text stays editable where the PDF contains real text." },
          { q: "What is the file-size limit?", a: "Up to 99 MB per PDF." }
        ]}
        tips={[
          "Works best on PDFs exported from a presentation (PowerPoint, Keynote, Google Slides).",
          "Check fonts after converting — a font missing on your computer is replaced by a similar one.",
          "Keep the tab open until the download starts — large files take longer."
        ]}
      />
    </div>
  );
}
