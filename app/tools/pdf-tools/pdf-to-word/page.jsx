'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_PDF_TO_WORD_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function PdfToWordPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [done, setDone] = useState(false);
  // Word's older formats too, as CloudConvert offers them: Rich Text (P25) and Word 97-2003 .doc (P26: the DOCX is
  // turned into .doc by LibreOffice on our pdf-tools service). All three for every PDF size accepted here (P26:
  // large PDFs too, through the media service).
  const [format, setFormat] = useState('docx');
  const [textBoxes, setTextBoxes] = useState(0);
  const [docFallback, setDocFallback] = useState(false);
  const inputRef = useRef();
  const [converted, offer, clearConverted] = useDownloadable();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    // Checked the moment the file is picked -- a file over the platform
    // ceiling would otherwise only fail after upload with a generic error.
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
    setTextBoxes(0);
    setDocFallback(false);
    clearConverted();

    try {
      setStage(null);
      const result = await convertOffice({ file: file, endpoint: '/api/pdf-to-word', fields: format !== 'docx' ? { format } : undefined, onStage: setStage });
      const blob = result.blob;
      setTextBoxes(format === 'doc' ? result.docTextBoxes || 0 : 0);
      const delivered = format === 'doc' && result.docFallback ? 'docx' : format;
      setDocFallback(delivered !== format);

      const filename = (file.name.replace(/\.[^.]+$/, '') || 'document') + `.${delivered}`;
      offer(blob, filename);
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
        <p className="text-neutral-500 text-center mb-2">Convert PDF files to an editable Word document: .docx, .doc (Word 97-2003) or .rtf</p>
        <p className="text-neutral-500 text-xs text-center mb-8">In our tests on PDFs exported from Word, headings, tables, columns and lists were kept. Scanned PDFs are not supported.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm" role="radiogroup" aria-label="Output format">
            {[['docx', 'Word (.docx)'], ['doc', 'Word 97-2003 (.doc)'], ['rtf', 'Rich Text (.rtf)']].map(([v, label]) => (
              <label key={v} className="flex items-center gap-2"><input type="radio" name="pw-format" value={v} checked={format === v} onChange={() => { setFormat(v); setDone(false); clearConverted(); }} /> {label}</label>
            ))}
          </div>
          {format === 'doc' && <p className="text-center text-neutral-600 text-xs" data-doc-note>.doc is made from the .docx by LibreOffice. Text placed in fixed-size text boxes can be cut in this older format — Word (.docx) keeps everything.</p>}
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes(MAX_PDF_TO_WORD_STAGED_BYTES)}className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? officeStageLabel(stage) : `Convert to .${format}`}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">Word document ready</div>
              {docFallback && <p className="text-amber-800 text-sm mb-2" data-doc-fallback>The .doc could not be made from this document, so here is the Word (.docx) version — Word 2007 and later, LibreOffice, Pages and Google Docs open it.</p>}
              {textBoxes > 0 && <p className="text-amber-800 text-sm mb-2" data-doc-textboxes>This document has {textBoxes} text box{textBoxes === 1 ? '' : 'es'}: check that their text is complete in the .doc, or use Word (.docx), which keeps it.</p>}
              <DownloadReady file={converted} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to Word"
        description="PDF to Word converts your PDF into a real, editable .docx Word document using our conversion provider, ConvertAPI. Your file is sent securely over HTTPS through our server to ConvertAPI, with file storage turned off, and deleted after conversion — we don't store or log it. For Word 97-2003 (.doc), which ConvertAPI does not write, that .docx is then converted to .doc by LibreOffice on our own conversion server and deleted right after. We tested two PDFs exported from Word (one with a table with merged cells, a two-column section, a numbered list, headers and footers, an image with text wrapping; one with footnotes and a watermark). We converted each back to PDF and compared it with the original: headings, table, columns, lists, header and footer, image, footnotes and watermark were all present and in place. We did not test PDFs from other sources (layout software, scans, forms), where results can differ."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose Word (.docx), Word 97-2003 (.doc) or Rich Text (.rtf), then click Convert. Your file is uploaded securely for conversion; once the document is ready, click 'Download'.",
          "Open the resulting .docx, .doc or .rtf file in Word or a compatible editor."
        ]}
        faqs={[
          { q: "Is PDF to Word completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does PDF to Word support?", a: "Input must be a PDF. Output is a Word document (.docx), the older Word 97-2003 format (.doc), or Rich Text Format (.rtf) — which Word, LibreOffice, Pages and WordPad all open — for every PDF size this tool accepts." },
          { q: "How is the .doc made, and is it as good as the .docx?", a: "The PDF is first converted to .docx, then LibreOffice converts that .docx to .doc on our own server. In our tests — including documents produced by our conversion provider — the .doc reopened in Microsoft Word and in LibreOffice with the same text, pages, tables and pictures as the .docx. One limit of the older format: text placed in fixed-size text boxes can be cut; the page tells you when your document has text boxes. Choose .docx whenever your software can open it." },
          { q: "Will my documents be uploaded to a server?", a: "Yes. Your file is sent securely over HTTPS through our server to our conversion provider, ConvertAPI, with file storage turned off, and deleted after conversion — we don't keep it. For .doc, the converted .docx also goes to our own conversion server, where LibreOffice makes the .doc, and is deleted right after." },
          { q: "Will the converted document keep my PDF's formatting?", a: "In our tests on two PDFs exported from Word, yes: headings, a table with merged cells, columns, numbered lists, header and footer, an image and footnotes carried over. We did not test PDFs from other sources, so check the result on yours." },
          { q: "Can I convert scanned or image-based PDFs?", a: "No — conversion relies on the PDF already containing a text layer. A scanned page with no underlying text (i.e. no OCR has been run on it) won't produce editable text in the output." },
          { q: "Do I need to install any software to use PDF to Word?", a: "No, it works directly in your web browser." }
        ]}
        tips={[
          "In our tests on PDFs exported from Word, the .docx kept headings, tables, columns and lists rather than only the plain text.",
          "Works best on PDFs that already contain a text layer (most PDFs exported from Word, Google Docs, or similar tools).",
          "Scanned or image-only PDFs need OCR performed elsewhere first — this tool doesn't perform OCR.",
          "Very large or complex files may take a little longer to convert — keep the tab open until the Download button appears."
        ]}
      />
    </div>
  );
}
