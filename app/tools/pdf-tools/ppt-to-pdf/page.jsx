'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { useToolError } from '../../../lib/useToolError';
import { OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function PptToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [done, setDone] = useState(false);
  const [detectedFonts, setDetectedFonts] = useState([]);
  const inputRef = useRef();
  const [pdf, offer, clearPdf] = useDownloadable();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    // Checked the moment the file is picked -- a file over the platform
    // ceiling would otherwise only fail after upload with a generic error.
    const sizeCheck = checkOfficeSize(f);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
    clearPdf();
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);
    clearPdf();
    setDetectedFonts([]);

    try {
      setStage(null);
      const result = await convertOffice({ file: file, endpoint: '/api/convert-to-pdf', onStage: setStage });
      setDetectedFonts(result.detectedFonts);
      const blob = result.blob;
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'presentation') + '.pdf';
      offer(blob, filename);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Oxford-comma join: "Wingdings", "Wingdings and Webdings", or
  // "Wingdings, Wingdings 2, and Wingdings 3" for the rare 3+ case.
  const detectedFontsList = detectedFonts.length <= 2
    ? detectedFonts.join(' and ')
    : `${detectedFonts.slice(0, -1).join(', ')}, and ${detectedFonts[detectedFonts.length - 1]}`;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PowerPoint to PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Convert .pptx, .ppt, slide shows (.ppsx, .pps), templates and OpenDocument .odp to PDF using LibreOffice</p>
        <p className="text-neutral-500 text-xs text-center mb-8">In our tests, layout, images, gradients, tables and charts carried over. A text box narrower than its text can wrap and be partly hidden, and Wingdings and Webdings icon fonts can&apos;t legally be reproduced and will appear blank.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PowerPoint or OpenDocument presentation" />}</p>
            <input ref={inputRef} type="file" accept=".pptx,.ppt,.odp,.otp,.pptm,.ppsx,.ppsm,.pps,.potx,.potm,.pot" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel()} per file</p>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes()} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? officeStageLabel(stage) : 'Convert to PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">PDF ready</div>
              <DownloadReady file={pdf} className="mt-3" />
              {detectedFonts.length > 0 && (
                <p className="text-amber-600 text-sm mt-3">
                  Heads up: this file uses {detectedFontsList} icon font{detectedFonts.length > 1 ? 's' : ''}, which can&apos;t legally be reproduced — those specific characters may appear as blank boxes in your PDF. Everything else converted normally.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PowerPoint to PDF"
        description={`PowerPoint to PDF turns a presentation into a PDF on our own LibreOffice conversion service. It reads .pptx, .ppt, macro-enabled .pptm, the slide-show files .ppsx, .ppsm and .pps, the templates .potx, .potm and .pot, and OpenDocument .odp and .otp. Every slide in our test decks became one PDF page; hidden slides and speaker notes were not tested. One difference with PowerPoint: a text box set not to wrap and narrower than its text is wrapped at its edge here, so part of the text can end up behind another shape.`}
        howToTitle="How to convert a PowerPoint presentation to PDF"
        howTo={[
          `Click or drop the deck whose slides you want as PDF pages.`,
          `Click "Convert to PDF"; the button reads "Converting...", after an upload percentage for a deck over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB.`,
          `When "PDF ready" is shown, click "Download" to keep the slides as one PDF.`,
        ]}
        specs={[
          { label: 'Input formats', value: `.pptx, .ppt, .pptm, .ppsx, .ppsm, .pps, .potx, .potm, .pot, .odp, .otp` },
          { label: 'Output', value: `One PDF file` },
          { label: 'Maximum file size', value: `${officeMaxLabel()} per file` },
          { label: 'Usage limits', value: `Decks over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB count toward a limit per network per hour and per day; smaller ones do not.` },
        ]}
        privacy={`Your presentation is uploaded over HTTPS to our server and converted by our LibreOffice service on Railway, without any outside provider. When the deck is bigger than ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB, it is sent in parts to our media service instead; that service drops the deck after the conversion and the PDF once this page has collected it, or after a time limit if it is never collected.`}
        faqs={[
          { q: `Will my fonts look the same in the PDF?`, a: `Yes when our service has the font or a close match. Segoe UI, which only Windows has, is replaced by Selawik, Microsoft's open replacement, whose letter widths matched Segoe UI in our measurement. Another missing font gets a similar typeface, which can move line breaks. Wingdings and Webdings symbols come out blank.` },
          { q: `Can a text box look different from PowerPoint?`, a: `Yes. When a box is narrower than its text and set not to wrap, PowerPoint lets the text run past the edge, while LibreOffice wraps it. In our test a slide title wrapped onto a second line, partly hidden by another box. Widen such boxes before converting.` },
          { q: `Are .ppt and OpenDocument files supported?`, a: `Yes. The older .ppt, .pptm, slide shows, templates, .odp and .otp all go through the same LibreOffice service, and we checked that each converts. Our comparison with two other online converters on 18 and 19 September 2026 used .pptx files: backgrounds, bullets, images, shapes, a gradient, a table and a pie chart matched.` },
        ]}
        tips={[
          `To share slides as pictures, convert the PDF afterwards with PDF to JPG.`,
        ]}
      />
    </div>
  );
}
