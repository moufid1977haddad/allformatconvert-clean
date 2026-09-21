'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';

export default function PdfToWordPage() {
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
    // Checked the moment the file is picked -- a file over the platform
    // ceiling would otherwise only fail after upload with a generic error.
    const sizeCheck = checkOfficeSize(f);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);

    try {
      setStage(null);
      const result = await convertOffice({ file: file, endpoint: '/api/pdf-to-word', onStage: setStage });
      const blob = result.blob;

      const filename = (file.name.replace(/\.[^.]+$/, '') || 'document') + '.docx';
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
        <h1 className="text-3xl font-bold text-center mb-2">PDF to Word</h1>
        <p className="text-neutral-500 text-center mb-2">Convert PDF files to an editable .docx document</p>
        <p className="text-neutral-400 text-xs text-center mb-8">In our tests on PDFs exported from Word, headings, tables, columns and lists were kept. Scanned PDFs are not supported.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-400 text-xs text-center -mt-2">Max {officeMaxLabel()} per file</p>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes()}className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? officeStageLabel(stage) : 'Download .docx'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">Word document downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser&apos;s downloads for the converted file.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to Word"
        description="PDF to Word converts your PDF into a real, editable .docx Word document using our conversion service. Your file is uploaded securely over HTTPS to our conversion service for processing, then deleted immediately afterward — it isn't stored, logged, or kept around. We tested two PDFs exported from Word (one with a table with merged cells, a two-column section, a numbered list, headers and footers, an image with text wrapping; one with footnotes and a watermark). We converted each back to PDF and compared it with the original: headings, table, columns, lists, header and footer, image, footnotes and watermark were all present and in place. We did not test PDFs from other sources (layout software, scans, forms), where results can differ."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Download .docx'. Your file is uploaded securely for conversion and the Word document downloads automatically once it's ready.",
          "Open the resulting .docx file in Word or a compatible editor."
        ]}
        faqs={[
          { q: "Is PDF to Word completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does PDF to Word support?", a: "Input must be a PDF. Output is .docx only — there's no legacy .doc output." },
          { q: "Will my documents be uploaded to a server?", a: "Yes. Your file is uploaded securely over HTTPS to our conversion service to generate the Word document, and is deleted immediately after conversion — it isn't stored or kept." },
          { q: "Will the converted document keep my PDF's formatting?", a: "In our tests on two PDFs exported from Word, yes: headings, a table with merged cells, columns, numbered lists, header and footer, an image and footnotes carried over. We did not test PDFs from other sources, so check the result on yours." },
          { q: "Can I convert scanned or image-based PDFs?", a: "No — conversion relies on the PDF already containing a text layer. A scanned page with no underlying text (i.e. no OCR has been run on it) won't produce editable text in the output." },
          { q: "Do I need to install any software to use PDF to Word?", a: "No, it works directly in your web browser." }
        ]}
        tips={[
          "In our tests on PDFs exported from Word, the .docx kept headings, tables, columns and lists rather than only the plain text.",
          "Works best on PDFs that already contain a text layer (most PDFs exported from Word, Google Docs, or similar tools).",
          "Scanned or image-only PDFs need OCR performed elsewhere first — this tool doesn't perform OCR.",
          "Very large or complex files may take a little longer to convert — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
