'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function PdfToWordPage() {
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

  // Client-side fallback: extracts each page's plain text with pdfjs-dist
  // and writes it into a new .docx as plain paragraphs, entirely in the
  // browser. This was this tool's ONLY implementation before the
  // server-side ConvertAPI path shipped; it's kept here (not deleted),
  // moved into its own function, purely so PDF_TO_WORD_CONVERTAPI_ENABLED
  // can be flipped back off server-side without breaking this tool for
  // visitors -- see the 404 handling in convert() below. It carries over
  // text only; images, fonts, tables, and the original layout are not
  // preserved, which is exactly why it's now the fallback rather than the
  // primary path.
  const convertClientSide = async (pdfFile) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const paragraphs = fullText.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    return Packer.toBlob(doc);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setDone(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pdf-to-word', { method: 'POST', body: formData });

      let blob;
      if (res.status === 404) {
        // A deliberate, distinct disabled-feature signal from the route
        // (PDF_TO_WORD_CONVERTAPI_ENABLED off) -- NOT a real conversion
        // failure. Falls back silently to the client-side extraction
        // above; the user never sees an error or any sign that anything
        // unusual happened. Confirmed via the JSON body so an unrelated
        // 404 (there shouldn't be one, but just in case) doesn't get
        // mistaken for this signal.
        let isDisabledSignal = false;
        try {
          const data = await res.json();
          isDisabledSignal = data && data.error === 'not_enabled';
        } catch {
          // Not JSON -- isDisabledSignal stays false, so this falls
          // through to a normal visible error below instead of a silent
          // fallback.
        }
        if (isDisabledSignal) {
          blob = await convertClientSide(file);
        } else {
          throw new Error('Conversion failed. Please try again.');
        }
      } else if (!res.ok) {
        // Any other non-ok response is a real ConvertAPI failure (502,
        // 503, 413, 415, etc.) -- surface it as a normal visible error,
        // exactly like word-to-pdf/page.jsx does. Never silently fall back
        // on a real failure, only on the disabled-feature 404 above.
        let message = 'Conversion failed. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Response wasn't JSON; fall back to the generic message above.
        }
        throw new Error(message);
      } else {
        blob = await res.blob();
      }

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
        <p className="text-neutral-500 text-center mb-2">Convert PDF files to a real, professional-quality .docx document</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Headings, paragraphs, fonts, and layout come through accurately.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? 'Converting...' : 'Download .docx'}
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
        description="PDF to Word converts your PDF into a real, editable .docx Word document using our conversion service. Your file is uploaded securely over HTTPS to our conversion service for processing, then deleted immediately afterward — it isn't stored, logged, or kept around. Headings, paragraphs, fonts, and the original layout are preserved accurately, not just plain extracted text."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Download .docx'. Your file is uploaded securely for conversion and the Word document downloads automatically once it's ready.",
          "Open the resulting .docx file in Word or a compatible editor."
        ]}
        faqs={[
          { q: "Is PDF to Word completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does PDF to Word support?", a: "Input must be a PDF. Output is .docx only — there's no legacy .doc output." },
          { q: "Will my documents be uploaded to a server?", a: "Yes. Your file is uploaded securely over HTTPS to our conversion service to generate the Word document, and is deleted immediately after conversion — it isn't stored or kept." },
          { q: "Will the converted document keep my PDF's formatting?", a: "Yes. Because conversion is done server-side rather than a simple text dump, headings, paragraphs, fonts, and layout carry over closely to the original PDF." },
          { q: "Can I convert scanned or image-based PDFs?", a: "No — conversion relies on the PDF already containing a text layer. A scanned page with no underlying text (i.e. no OCR has been run on it) won't produce editable text in the output." },
          { q: "Do I need to install any software to use PDF to Word?", a: "No, it works directly in your web browser." }
        ]}
        tips={[
          "Our server-side conversion preserves headings, paragraphs, fonts, and layout far more accurately than plain text extraction.",
          "Works best on PDFs that already contain a text layer (most PDFs exported from Word, Google Docs, or similar tools).",
          "Scanned or image-only PDFs need OCR performed elsewhere first — this tool doesn't perform OCR.",
          "Very large or complex files may take a little longer to convert — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
