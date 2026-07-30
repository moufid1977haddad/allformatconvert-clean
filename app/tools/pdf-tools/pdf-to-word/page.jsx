'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function PdfToWordPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
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
      const blob = await Packer.toBlob(doc);
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF to Word</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF to a .docx Word document</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to Word'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.pdf', '.docx')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download .docx</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to Word"
        description="PDF to Word extracts each page's plain text using the PDF.js library and writes it into a new .docx file as plain paragraphs, using the docx library entirely in your browser — your file is never uploaded to a server. It carries over text only; images, fonts, tables, and the original layout are not preserved."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Convert to Word' to extract text from every page.",
          "Click 'Download .docx' once conversion finishes.",
          "Open the file in Word or a compatible editor."
        ]}
        faqs={[
          { q: "Is PDF to Word really free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does the converter support?", a: "Output is .docx only, and input must be a PDF — there's no legacy .doc output." },
          { q: "Will the converted document keep my PDF's formatting, images, and tables?", a: "No — only the extracted text is included as plain paragraphs. Images, fonts, tables, and the original page layout aren't preserved." },
          { q: "Can I convert scanned or image-based PDFs?", a: "No — text extraction only works on PDFs that already contain a text layer. Scanned pages produce no text, since no OCR is performed." }
        ]}
        tips={[
          "Treat the output as a plain-text draft, not a formatted copy — expect to reapply headings, bold text, and layout yourself in Word.",
          "Works only on PDFs with an existing text layer; scanned documents need OCR elsewhere first.",
          "Review paragraph breaks after conversion, since they follow the PDF's line breaks rather than true paragraph structure.",
          "Keep your original PDF, since this is a one-way, text-only export."
        ]}
      />
    </div>
  );
}