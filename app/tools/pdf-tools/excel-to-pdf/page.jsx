'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { MAX_SPREADSHEET_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [detectedFonts, setDetectedFonts] = useState([]);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    // Checked the moment the file is picked -- a file over the platform
    // ceiling would otherwise only fail after upload with a generic error.
    const sizeCheck = checkOfficeSize(f, MAX_SPREADSHEET_STAGED_BYTES);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    const sizeCheck = checkOfficeSize(file, MAX_SPREADSHEET_STAGED_BYTES);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    setDone(false);
    setDetectedFonts([]);

    try {
      setStage(null);
      const result = await convertOffice({ file: file, endpoint: '/api/convert-to-pdf', onStage: setStage });
      setDetectedFonts(result.detectedFonts);
      const blob = result.blob;
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'spreadsheet') + '.pdf';
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

  // Oxford-comma join: "Wingdings", "Wingdings and Webdings", or
  // "Wingdings, Wingdings 2, and Wingdings 3" for the rare 3+ case.
  const detectedFontsList = detectedFonts.length <= 2
    ? detectedFonts.join(' and ')
    : `${detectedFonts.slice(0, -1).join(', ')}, and ${detectedFonts[detectedFonts.length - 1]}`;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Convert .xlsx, .xls, .csv, and .ods files to PDF using LibreOffice</p>
        <p className="text-neutral-400 text-xs text-center mb-8">In our tests, number formats, formulas, merged cells and color scales carried over. Wingdings and Webdings icon fonts can&apos;t legally be reproduced and will appear blank.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an Excel file here'}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-neutral-400 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)} per file</p>
          <button onClick={convert} disabled={!file || loading || file.size > officeMaxBytes(MAX_SPREADSHEET_STAGED_BYTES)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? officeStageLabel(stage) : 'Download PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">PDF downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser's downloads for the converted file.</p>
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
        description="Excel to PDF converts your .xlsx, .xls, .csv, or .ods file into a PDF using LibreOffice. Your file is uploaded securely over HTTPS to our conversion service for processing, then deleted immediately afterward — it isn't stored, logged, or kept around. We tested .xlsx workbooks with currency, percentage and date formats, merged cells, cell borders, color-scale conditional formatting, a bar chart, a wrapped-text column and formulas (multiplication, IF and cross-sheet lookups): the formulas were recalculated to the right values, and a sheet set to fit on one page stayed on one page. A sheet wider than the page, with no print area or scaling, is split across several PDF pages by groups of columns (another converter shrank the same sheet onto fewer pages). The chart was drawn, but its styling differs from what other converters produce, so check it in your PDF. One disclosed exception: Wingdings and Webdings icon fonts can't legally be embedded in our conversion service (a font-licensing restriction, not a bug), so those specific characters come through as blank boxes if your file uses them."
        howTo={[
          "Click the upload area and select an .xlsx, .xls, .csv, or .ods file from your device.",
          "Click 'Download PDF'. Your file is uploaded securely for conversion and the PDF downloads automatically once it's ready.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Excel to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does the tool support?", a: "It accepts .xlsx, .xls, .csv, and .ods files." },
          { q: "Will my files be uploaded to a server?", a: "Yes. Your file is uploaded securely over HTTPS to our conversion service, which uses LibreOffice to generate the PDF, and is deleted immediately after conversion — it isn't stored or kept." },
          { q: "Can I convert multiple Excel files at once?", a: "No, only one file can be converted at a time." },
          { q: "Will formulas and formatting carry over?", a: "In our tests on .xlsx files, formula results (including cross-sheet lookups), number formats, merged cells, cell borders and color-scale conditional formatting carried over. We did not test macros or very complex conditional formatting, and we measured .xlsx only, not .xls, .csv or .ods." },
          { q: "Why is my wide spreadsheet split across several pages?", a: "A sheet wider than one page, with no print area or scaling set, is split into pages by groups of columns. Setting the sheet to fit on one page wide in Excel (Page Layout > Scale to Fit) before uploading keeps it together — a sheet set to fit on one page stayed on one page in our test." },
        ]}
        tips={[
          "Every sheet in your workbook is converted in its original order, each starting on its own page(s).",
          "Wide sheets are split by groups of columns unless you set them to fit on one page wide in Excel first (Page Layout > Scale to Fit).",
          "Formulas are recalculated during conversion, so the PDF shows current values.",
          "We tested standard formatting (number formats, color scales, merged cells); macros and very complex conditional formatting were not tested."
        ]}
      />
    </div>
  );
}
