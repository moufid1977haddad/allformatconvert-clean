'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { useToolError } from '../../../lib/useToolError';
import { OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function WordToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [done, setDone] = useState(false);
  const [detectedFonts, setDetectedFonts] = useState([]);
  // P30: set when the usual .docx engine (ConvertAPI) was unavailable and our LibreOffice server made the PDF.
  const [engineFallback, setEngineFallback] = useState(null);
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
    setEngineFallback(null);

    try {
      setStage(null);
      // engineFallback: this page shows the "backup converter" notice, so the route may use it (P30).
      const result = await convertOffice({ file: file, endpoint: '/api/convert-to-pdf', fields: { engineFallback: 'allowed' }, onStage: setStage });
      setDetectedFonts(result.detectedFonts);
      setEngineFallback(result.engineFallback || null);
      const blob = result.blob;
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'document') + '.pdf';
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
        <h1 className="text-3xl font-bold text-center mb-2">Word to PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Convert .docx, .doc, .odt, .rtf and other word-processor files to PDF</p>
        <p className="text-neutral-500 text-xs text-center mb-8">In our tests, .docx fonts, tables, columns, headers and footers matched two other online converters.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a Word, OpenDocument or RTF file" />}</p>
            <input ref={inputRef} type="file" accept=".docx,.doc,.odt,.ott,.rtf,.docm,.dotx,.dotm,.dot,.wpd" className="hidden" onChange={handleFile} />
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
              {engineFallback && (
                <p className="text-amber-700 text-sm mt-3" role="status" data-engine-fallback>
                  Made by our backup converter: the engine we normally use for .docx files is unavailable right now, so our own LibreOffice server made this PDF. Your text is all there, but fonts, line and page breaks and equation spacing can differ from Word, and an image stored in a non-standard way can be missing. For the usual conversion, try again later.
                </p>
              )}
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
        title="Word to PDF"
        description={`Word to PDF turns a word-processor document into a PDF whose text you can select and search. It accepts .docx, .doc, macro-enabled .docm, the templates .dotx, .dotm and .dot, OpenDocument .odt and .ott, .rtf and WordPerfect .wpd; Microsoft Works .wps is refused because our converter reads it as a blank page. A .docx is converted by ConvertAPI, our provider, and every other format by our own LibreOffice service. With a .docx, fields are not recalculated: a table of contents shows what was last saved in the file; our LibreOffice service, used for the other formats, can update it.`}
        howToTitle="How to convert a Word document to PDF"
        howTo={[
          `Click or drop your document on the upload area; a file over ${officeMaxLabel()} is refused before anything is sent.`,
          `Click "Convert to PDF": the button shows "Converting...", preceded by the upload percentage for a file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB.`,
          `When "PDF ready" appears, click "Download" to save the PDF; a note under it tells you when our backup converter made it.`,
        ]}
        specs={[
          { label: 'Input formats', value: `.docx, .doc, .docm, .dotx, .dotm, .dot, .odt, .ott, .rtf, .wpd` },
          { label: 'Output', value: `One PDF file with selectable text` },
          { label: 'Maximum file size', value: `${officeMaxLabel()} per file` },
          { label: 'Files at once', value: `One` },
          { label: 'Usage limits', value: `A .docx counts toward a limit per network per hour and per day, shared with the site's other paid tools, and toward a monthly budget for the whole site. Any file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB counts toward a separate hourly and daily limit for your connection.` },
        ]}
        privacy={`Your document goes over HTTPS to our server. A .docx is passed on to ConvertAPI with its file storage turned off; if ConvertAPI is unavailable, our own LibreOffice service makes the PDF instead and the page says so. Other formats go straight to that LibreOffice service. A file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB is first uploaded in parts to our media service, which deletes the original when the conversion ends and the PDF as soon as this page has fetched it, or after a time limit if the page never does.`}
        faqs={[
          { q: `Are DOC and DOCX both supported?`, a: `Yes. A .docx is converted by ConvertAPI, whose output matched two other online converters page by page in our tests of 18 and 19 September 2026. A .doc, like the OpenDocument, RTF, template and WordPerfect files, goes to our LibreOffice service; we checked that each of these converts, but measured fidelity on .docx only.` },
          { q: `Will the fonts and layout stay the same?`, a: `Yes for the .docx files we tested: Calibri, Cambria, Arial and Arial Narrow text, two-level numbered lists, a table with merged cells, a wrapped image, a two-column section, headers and footers with page numbers, footnotes and a watermark matched the original. When our LibreOffice service makes the PDF, Wingdings and Webdings symbols are not reproduced.` },
          { q: `Is the table of contents updated during conversion?`, a: `No for a .docx converted by ConvertAPI: a table of contents, a page reference or a date shows the value last saved in the document, so update it in Word and save before converting. Our LibreOffice service, which handles the other formats and the backup, recalculated the table of contents in our test of 4 October 2026.` },
          { q: `Can I still convert a .docx when ConvertAPI is down?`, a: `Yes. Our own LibreOffice service makes the PDF and a note next to the download says so. All your text is there, but fonts, line and page breaks and equation spacing can differ from Word, and an image stored in an unusual way can be missing. Try again later for the usual conversion.` },
        ]}
        tips={[
          `Converting a spreadsheet or a slide deck? Use Excel to PDF or PowerPoint to PDF: this page only takes word-processor files.`,
        ]}
      />
    </div>
  );
}
