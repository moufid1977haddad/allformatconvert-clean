'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_PDF_TO_WORD_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
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
        <p className="text-neutral-500 text-xs text-center mb-8">In our tests on PDFs exported from Word, headings, tables, columns and lists were kept. Scanned PDFs were not tested.</p>
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
        description={`PDF to Word turns a PDF into a Word document you can edit: .docx, Word 97-2003 .doc, or Rich Text .rtf. The conversion is done by ConvertAPI, our provider; for .doc, our own LibreOffice service then rewrites the .docx in the older format. In our test of 19 September 2026 on two PDFs exported from Word, headings, a table with a merged cell, columns, numbered lists, header and footer, an image, footnotes and a watermark came back in place. PDFs from other software, forms and scans were not tested.`}
        howToTitle="How to convert PDF to Word"
        howTo={[
          `Click or drop the PDF you want to edit in Word.`,
          `Choose "Word (.docx)", "Word 97-2003 (.doc)" or "Rich Text (.rtf)".`,
          `Click the convert button, whose label follows the format you chose.`,
          `When "Word document ready" appears, "Download" saves the editable document in the format you chose.`,
        ]}
        specs={[
          { label: 'Input format', value: `PDF` },
          { label: 'Output formats', value: `DOCX, DOC (Word 97-2003) or RTF` },
          { label: 'Maximum file size', value: `${officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file` },
          { label: 'Usage limits', value: `A limit per network per hour and per day, shared with the site's other paid tools, and a monthly budget for the whole site` },
        ]}
        privacy={`Your PDF goes over HTTPS through our server to ConvertAPI, which converts it with its file storage turned off. For .doc, the .docx that comes back is sent on to our own LibreOffice service to make the older format. A PDF over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB is first uploaded in parts to our media service, which deletes it when the conversion ends and deletes the Word file as soon as this page has received it, or after a time limit.`}
        faqs={[
          { q: `Will the Word file keep my formatting?`, a: `Yes for the two Word-exported PDFs we tested on 19 September 2026: after a round trip, headings, a table with a merged cell, two columns, numbered lists, header and footer, a wrapped image, footnotes and a watermark were in place. PDFs made by other software were not tested, so check the result on yours.` },
          { q: `Is the .doc as good as the .docx?`, a: `Yes for ordinary text, tables and pictures: in our tests the .doc reopened in Word and LibreOffice with the same text, pages, tables and pictures. Text inside fixed-size text boxes can be cut in the older format, and the page counts such boxes for you. Choose .docx whenever your software opens it.` },
          { q: `Is there a usage limit?`, a: `Yes. Each conversion is a paid call to ConvertAPI, so every network has an hourly and a daily allowance shared with the site's other paid tools, and the whole site has a monthly budget. The limit message says how long to wait, or, for the monthly budget, the date it resets.` },
          { q: `Do I still get a file if the .doc step fails?`, a: `Yes: you receive the .docx that ConvertAPI already made, and a note explains that the .doc could not be produced. Word 2007 and later, LibreOffice, Pages and Google Docs open a .docx.` },
        ]}
        tips={[
          `For a scanned PDF, run PDF OCR first to give it a text layer, then convert the result here.`,
          `Pick Rich Text (.rtf) for WordPad or an older word processor that reads neither .docx nor .doc.`,
        ]}
      />
    </div>
  );
}
