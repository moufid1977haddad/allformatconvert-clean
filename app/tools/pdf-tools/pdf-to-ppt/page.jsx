'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_PDF_TO_WORD_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Same pipeline as PDF to Word (ConvertAPI, staged upload for large files) -- lib/pdfToOfficeRoute.ts.
export default function PdfToPptPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [done, setDone] = useState(false);
  const inputRef = useRef();
  const [converted, offer, clearConverted] = useDownloadable();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    const sizeCheck = checkOfficeSize(f, MAX_PDF_TO_WORD_STAGED_BYTES);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
    clearConverted();
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file, MAX_PDF_TO_WORD_STAGED_BYTES);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);
    clearConverted();
    try {
      setStage(null);
      const result = await convertOffice({ file, endpoint: '/api/pdf-to-ppt', onStage: setStage });
      offer(result.blob, (file.name.replace(/.[^.]+$/, '') || 'document') + '.pptx');
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
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file</p>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes(MAX_PDF_TO_WORD_STAGED_BYTES)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
            {loading ? officeStageLabel(stage) : 'Convert to .pptx'}
          </button>
          {error && <p className="text-center text-red-600 text-sm" role="alert">{error}</p>}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-700 text-xl font-bold mb-1">PowerPoint file ready</div>
              <DownloadReady file={converted} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to PowerPoint"
        description={`PDF to PowerPoint rebuilds each page of a PDF as a slide in a .pptx presentation, with text boxes and images you can move and edit. The conversion is done by ConvertAPI, our provider. In our test of 23 September 2026 against iLovePDF on two presentation PDFs with bullets, an image, a chart and a gradient shape, both gave the same number of slides, of editable text boxes and of images. Text is editable only where the PDF contains real text.`}
        howToTitle="How to convert PDF to PowerPoint"
        howTo={[
          `Click or drop the PDF whose pages should become slides.`,
          `Click "Convert to .pptx".`,
          `When "PowerPoint file ready" appears, click "Download" to save the .pptx presentation.`,
        ]}
        specs={[
          { label: 'Input format', value: `PDF` },
          { label: 'Output format', value: `PPTX, one slide per page` },
          { label: 'Maximum file size', value: `${officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file` },
          { label: 'Usage limits', value: `An allowance per network for each hour and each day, common to the site's paid tools, and a monthly budget for the site` },
        ]}
        privacy={`Your PDF is passed over HTTPS from our server to ConvertAPI, where it is converted with file storage disabled. A file larger than ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB is first sent in parts to our media service; that service removes the PDF when the conversion is over and the presentation once this page has received it, or after a time limit.`}
        faqs={[
          { q: `Will each PDF page become a slide?`, a: `Yes. The presentation has one slide per page, in page order. In our comparison with iLovePDF on 23 September 2026, both tools gave the same slide count on the two test files.` },
          { q: `Can I edit the text in PowerPoint?`, a: `Yes, where the PDF holds real text: it comes back in text boxes you can change, move or restyle. Pictures come back as images that you can move, resize or replace.` },
          { q: `Does a big PDF count against a limit?`, a: `Yes, every PDF does, whatever its size: each conversion is a paid call to ConvertAPI, counted in your network's hourly and daily allowance and in the site's monthly budget. A message tells you when the next conversion is possible.` },
        ]}
        tips={[
          `Want pictures of the pages rather than editable slides? Use PDF to JPG instead.`,
        ]}
      />
    </div>
  );
}
