'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';

export default function WordToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState('');
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
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a Word, OpenDocument or RTF file here'}</p>
            <input ref={inputRef} type="file" accept=".docx,.doc,.odt,.ott,.rtf,.docm,.dotx,.dotm,.dot,.wps,.wpd" className="hidden" onChange={handleFile} />
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
        title="Word to PDF"
        description="Word to PDF converts your .docx or .doc file into a PDF. A .docx file is sent securely over HTTPS through our server to our conversion provider, ConvertAPI, with file storage turned off; an older .doc file is converted by our own LibreOffice server. Either way the file is deleted after conversion — we don't store or log it. We tested .docx files with Calibri, Cambria, Arial and Arial Narrow text, two-level numbered lists, a table with merged cells, an image with text wrapping, a two-column section, headers and footers with page numbers, footnotes and a watermark: every page matched the output of two other online converters, and the text stays fully selectable. Two disclosed limits: a Word-generated table of contents is not recalculated during conversion — it shows whatever was last cached in the .docx, not a freshly rebuilt table — and the older .doc format takes a different conversion path that we have not measured."
        howTo={[
          "Click the upload area and select a Word file (.docx, .doc, .docm, .dotx, .dot), an OpenDocument text (.odt, .ott), an RTF, or a Works / WordPerfect file (.wps, .wpd).",
          "Click 'Convert to PDF'. Your file is uploaded securely for conversion; once the PDF is ready, click 'Download'.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Word to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does Word to PDF support?", a: ".docx (converted by ConvertAPI) and, converted by our own LibreOffice server: .doc, macro-enabled .docm, templates .dotx / .dotm / .dot, OpenDocument .odt / .ott, .rtf, Microsoft Works .wps and WordPerfect .wpd. We checked that each of these formats converts; the page-by-page fidelity measurement quoted on this page was made on .docx files." },
          { q: "Will my documents be uploaded to a server?", a: "Yes. A .docx file goes securely over HTTPS through our server to our conversion provider, ConvertAPI (file storage turned off); a .doc file goes to our own LibreOffice server. The file is deleted after conversion — we don't keep it." },
          { q: "Do I need to install any software to use Word to PDF?", a: "No, it works directly in your web browser." },
          { q: "Will the text in my PDF be selectable?", a: "Yes. Because conversion is done server-side rather than by rasterizing a screenshot, the resulting PDF has fully selectable, searchable text." },
          { q: "Why does this look different from the previous in-browser converter?", a: "This tool now converts documents server-side instead of approximating the layout in your browser. The trade-off is that your file is uploaded; in return, fonts, spacing and page layout follow the original Word document, and the text is selectable." },
          { q: "Will my table of contents update automatically?", a: "No. A table of contents (or any other calculated field) is converted using whatever was last cached in the .docx file, not recalculated during conversion. In Word, click into the table of contents and choose \"Update Field\" before converting if you want it to reflect your current headings and page numbers." }
        ]}
        tips={[
          "In our tests on .docx files, fonts, spacing and page layout matched two other online converters.",
          "The resulting PDF has selectable, searchable text rather than a flattened image.",
          "Update any table of contents or calculated fields in Word before converting — they carry over as last saved, not recalculated.",
          "Very large or complex files may take a little longer to convert — keep the tab open until the Download button appears."
        ]}
      />
    </div>
  );
}
