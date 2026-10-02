'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_PDF_TO_WORD_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { PDF_NO_TABLES_MESSAGE } from '@/lib/pdfNoTables';
import { pdfTextToXlsx } from '../../../lib/pdfTextToSheet';
import { useToolError } from '../../../lib/useToolError';

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
            <p className="text-neutral-500">{file ? file.name : 'Click to choose a PDF'}</p>
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
        description="PDF to Excel converts the tables of your PDF into an editable .xlsx spreadsheet, with rows and columns you can sort, filter and calculate with. In our tests on two spreadsheet PDFs (a 40-row sales table with dates, prices and percentages, and a sheet with five tables), every table came out with the same cells as the leading online PDF converter's, with numbers and dates as real values you can calculate with. The conversion is done by ConvertAPI, the same provider as our PDF to Word tool; your file is sent over HTTPS and deleted after conversion."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Convert to .xlsx'. Your file is uploaded securely for conversion; once the Excel file is ready, click 'Download'.",
          "Open the .xlsx file in Excel or a compatible app and check the result."
        ]}
        faqs={[
          { q: "Is PDF to Excel free to use?", a: "Yes, it's free with no signup required." },
          { q: "Will my PDF be uploaded to a server?", a: "Yes. Your file is sent over HTTPS to our conversion provider (ConvertAPI) to create the Excel file, and deleted afterwards — it isn't stored." },
          { q: "What does the output contain?", a: "An .xlsx workbook. Tables found in the PDF become cells you can edit, sort and use in formulas." },
          { q: "What if my PDF has no table?", a: "You still get a workbook: when no table is found, the PDF's text is placed in the sheet line by line (one sheet per page, aligned columns kept as columns), built in your browser. A scanned PDF has no text layer — run it through PDF OCR first." },
          { q: "What is the file-size limit?", a: "Up to 99 MB per PDF." }
        ]}
        tips={[
          "Works best on PDFs exported from a spreadsheet or report, where tables are real text.",
          "Check totals and merged cells after converting — complex layouts can split differently.",
          "Keep the tab open until the Download button appears — large files take longer."
        ]}
      />
    </div>
  );
}
