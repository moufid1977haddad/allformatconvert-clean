'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_PDF_TO_WORD_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { PDF_NO_TABLES_MESSAGE } from '@/lib/pdfNoTables';
import { pdfTextToXlsx } from '../../../lib/pdfTextToSheet';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Same pipeline as PDF to Word (ConvertAPI, staged upload for large files) -- lib/pdfToOfficeRoute.ts.
export default function PdfToExcelPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');
  const inputRef = useRef();
  const [converted, offer, clearConverted] = useDownloadable();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    const sizeCheck = checkOfficeSize(f, MAX_PDF_TO_WORD_STAGED_BYTES);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
    setNote('');
    clearConverted();
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file, MAX_PDF_TO_WORD_STAGED_BYTES);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);
    setNote('');
    clearConverted();
    try {
      setStage(null);
      const result = await convertOffice({ file, endpoint: '/api/pdf-to-excel', onStage: setStage });
      offer(result.blob, (file.name.replace(/.[^.]+$/, '') || 'document') + '.xlsx');
      setDone(true);
    } catch (err) {
      if (err?.message === PDF_NO_TABLES_MESSAGE) {
        // No table for the converter: the sheet is built here from the PDF's text (one row per line).
        try {
          const r = await pdfTextToXlsx(file);
          if (!r.rows) { setError('This PDF has no text to put in a sheet — it looks like a scanned image. Run it through PDF OCR first, then convert the result.'); return; }
          offer(r.blob, (file.name.replace(/.[^.]+$/, '') || 'document') + '.xlsx');
          setNote(`No table was found in this PDF, so its text was placed in the sheet line by line (${r.rows} row${r.rows === 1 ? '' : 's'}, one sheet per page).`);
          setDone(true);
        } catch { setError('This PDF could not be read. It may be damaged or password-protected.'); }
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF to Excel</h1>
        <p className="text-neutral-500 text-center mb-8">Turn the tables of a PDF into an editable Excel spreadsheet</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file</p>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes(MAX_PDF_TO_WORD_STAGED_BYTES)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
            {loading ? officeStageLabel(stage) : 'Convert to .xlsx'}
          </button>
          {error && <p className="text-center text-red-600 text-sm" role="alert">{error}</p>}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-700 text-xl font-bold mb-1">Excel file ready</div>
              {note && <p className="text-neutral-600 text-sm" data-note>{note}</p>}
              <DownloadReady file={converted} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to Excel"
        description={`PDF to Excel pulls the tables out of a PDF into an .xlsx workbook whose cells you can sort, filter and use in formulas. ConvertAPI, our conversion provider, finds the tables and keeps numbers and dates as real values. When it finds none, the sheet is built from the PDF's text instead, one sheet per page and one row per line, with a new cell wherever aligned text is separated by a wide gap. A scanned page has no text to read until PDF OCR has been run on it.`}
        howToTitle="How to convert PDF to Excel"
        howTo={[
          `Click or drop the PDF whose tables you want in Excel.`,
          `Click "Convert to .xlsx" and wait while the file is uploaded and converted.`,
          `When "Excel file ready" appears, click "Download" to save the .xlsx workbook.`,
        ]}
        specs={[
          { label: 'Input format', value: `PDF` },
          { label: 'Output format', value: `XLSX workbook` },
          { label: 'Maximum file size', value: `${officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)} per file` },
          { label: 'Usage limits', value: `Hourly and daily limits per network, shared with the site's other paid tools, plus a monthly budget for the whole site` },
        ]}
        privacy={`The PDF travels over HTTPS through our server to ConvertAPI, which converts it with its file storage switched off. If no table is found, the fallback sheet is built in this browser tab from the same file, with no further transfer. Above ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB, the PDF first goes in parts through our media service, which deletes it after the conversion and deletes the workbook as soon as this page has received it, or after a time limit.`}
        faqs={[
          { q: `Are numbers and dates kept as real values?`, a: `Yes. In our test of 23 September 2026 against iLovePDF on the same files, the tables came out with the same typed values: 160 numbers and 40 dates in a sales table, and five identical tables from a sheet that held five of them.` },
          { q: `Do I get a workbook if my PDF has no table?`, a: `Yes. The page builds one from the PDF's text: one sheet per page, named after it, one row per line of text, and a new cell wherever a wide gap separates aligned text. A note under the result says how many rows were made.` },
          { q: `Is there a usage limit?`, a: `Yes. Each conversion is billed to us by ConvertAPI, so your network has an hourly and a daily allowance, counted together with the site's other paid tools, and the site as a whole has a monthly budget. The page tells you when you can convert again.` },
        ]}
        tips={[
          `For a scanned PDF, run PDF OCR first so that its text can be read, then convert the searchable PDF here.`,
        ]}
      />
    </div>
  );
}
