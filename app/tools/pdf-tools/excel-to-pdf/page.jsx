'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_SPREADSHEET_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  // P24 (03/10): each sheet on one page (Gotenberg singlePageSheets), for sheets wider than a page
  const [onePage, setOnePage] = useState(false);
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
    const sizeCheck = checkOfficeSize(f, MAX_SPREADSHEET_STAGED_BYTES);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
    clearPdf();
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file, MAX_SPREADSHEET_STAGED_BYTES);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);
    clearPdf();
    setDetectedFonts([]);

    try {
      setStage(null);
      const result = await convertOffice({ file: file, endpoint: '/api/convert-to-pdf', onStage: setStage, fields: onePage ? { singlePageSheets: 'true' } : {} });
      setDetectedFonts(result.detectedFonts);
      const blob = result.blob;
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'spreadsheet') + '.pdf';
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
        <h1 className="text-3xl font-bold text-center mb-2">Excel to PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Convert .xlsx, .xls, .xlsm, .xlsb, .csv, .ods and other spreadsheets to PDF using LibreOffice</p>
        <p className="text-neutral-500 text-xs text-center mb-8">In our tests, number formats, formulas, merged cells and color scales carried over. Wingdings and Webdings icon fonts can&apos;t legally be reproduced and will appear blank.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="an Excel file" />}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.ods,.ots,.xlsm,.xlsb,.xltx,.xltm,.xlt" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)} per file</p>
          <label className="flex items-center gap-2 text-sm text-neutral-700"><input id="xl-one-page" type="checkbox" checked={onePage} onChange={(e) => setOnePage(e.target.checked)} disabled={loading} /> Fit each sheet on one page (a wide sheet is not cut over several pages)</label>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes(MAX_SPREADSHEET_STAGED_BYTES)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
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
        title="Excel to PDF"
        description={`Excel to PDF prints a spreadsheet to PDF with LibreOffice on our own conversion service. It reads .xlsx, .xls, macro-enabled .xlsm, binary .xlsb, the templates .xltx, .xltm and .xlt, .csv, and OpenDocument .ods and .ots files. Formula results are printed as they are stored in the workbook; in our test files, formulas saved without a result were calculated. A sheet wider than the paper, with no print area or scaling set, is split across pages by groups of columns unless you tick the option that puts each sheet on one page. Charts are drawn, but their styling can differ from Excel's own.`}
        howToTitle="How to convert an Excel spreadsheet to PDF"
        howTo={[
          `Click or drop the workbook whose sheets you want in a PDF.`,
          `Tick "Fit each sheet on one page" if a sheet is wider than the paper and you want it on a single page.`,
          `Click "Convert to PDF", and "Download" saves the sheets as one PDF once "PDF ready" appears.`,
        ]}
        specs={[
          { label: 'Input formats', value: `.xlsx, .xls, .xlsm, .xlsb, .xltx, .xltm, .xlt, .csv, .ods, .ots` },
          { label: 'Output', value: `One PDF file` },
          { label: 'Maximum file size', value: `${officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)} per file, a limit set by LibreOffice's conversion time` },
          { label: 'Usage limits', value: `Files up to ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB: none. Larger files: a limit per network per hour and per day.` },
        ]}
        privacy={`The spreadsheet is sent over HTTPS to our server, which hands it to our own LibreOffice service (Gotenberg, hosted on Railway); no outside provider receives it. A workbook larger than ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB travels first, in parts, to our media service: the original is removed when the PDF is made, and the PDF is erased once this page has fetched it, right after the conversion, or after a time limit.`}
        faqs={[
          { q: `Can I fit a wide sheet on one page?`, a: `Yes. Tick "Fit each sheet on one page" before converting. Without it, a sheet wider than the paper and with no print area or scaling is cut into pages by groups of columns, which is LibreOffice's normal behavior. You can also set Scale to Fit in Excel before uploading.` },
          { q: `Does the one-page option lose rows on a very long sheet?`, a: `No. In our test of 3 October 2026, sheets of up to 30,000 rows each came out as one tall page with every row present. The text becomes very small, so for long lists the normal page-by-page layout is easier to read.` },
          { q: `Are formulas and number formats kept?`, a: `Yes in our tests of 18 and 19 September 2026 on .xlsx files: formulas, including cross-sheet lookups, showed the right values, and currency, percentage and date formats, merged cells, borders and color scales carried over. The other formats, except .xlt and .csv, were checked to convert, not measured.` },
          { q: `Can I convert several workbooks at once?`, a: `No. The upload area takes one file per conversion. Download the PDF, then choose the next workbook; each one is converted on its own.` },
        ]}
        tips={[
          `Wingdings and Webdings symbols come out blank; for an .xlsx file, the result names the font when the workbook uses one, so you can replace it and convert again.`,
        ]}
      />
    </div>
  );
}
