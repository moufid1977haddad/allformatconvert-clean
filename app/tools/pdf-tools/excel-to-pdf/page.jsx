'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [detectedFonts, setDetectedFonts] = useState([]);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setError('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setDone(false);
    setDetectedFonts([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert-to-pdf', { method: 'POST', body: formData });

      if (!res.ok) {
        let message = 'Conversion failed. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Response wasn't JSON; fall back to the generic message above.
        }
        throw new Error(message);
      }

      const detectedFontsHeader = res.headers.get('X-Detected-Symbol-Fonts');
      setDetectedFonts(detectedFontsHeader ? detectedFontsHeader.split(',') : []);

      const blob = await res.blob();
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
        <p className="text-neutral-500 text-center mb-2">Convert .xlsx, .xls, and .csv files to PDF using LibreOffice</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Standard fonts and formatting come through accurately. Wingdings and Webdings icon fonts can&apos;t legally be reproduced and will appear blank if your file uses them.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an Excel file here'}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? 'Converting...' : 'Download PDF'}
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
        description="Excel to PDF converts your .xlsx, .xls, or .csv file into a real, professional-quality PDF using LibreOffice, the same conversion engine used by many enterprise document pipelines. Your file is uploaded securely over HTTPS to our conversion service for processing, then deleted immediately afterward — it isn't stored, logged, or kept around. Every sheet in your workbook is rendered with accurate column widths, number formats, and cell borders. The one disclosed exception: Wingdings and Webdings icon fonts can't legally be embedded in our conversion service (a font-licensing restriction, not a bug), so those specific characters come through as blank boxes if your file uses them — everything else converts normally."
        howTo={[
          "Click the upload area and select an .xlsx, .xls, or .csv file from your device.",
          "Click 'Download PDF'. Your file is uploaded securely for conversion and the PDF downloads automatically once it's ready.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Excel to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does the tool support?", a: "It accepts .xlsx, .xls, and .csv files." },
          { q: "Will my files be uploaded to a server?", a: "Yes. Your file is uploaded securely over HTTPS to our conversion service, which uses LibreOffice to generate the PDF, and is deleted immediately after conversion — it isn't stored or kept." },
          { q: "Can I convert multiple Excel files at once?", a: "No, only one file can be converted at a time." },
          { q: "Will formulas and formatting carry over?", a: "Formula results, number formats, column widths, and cell borders are preserved because conversion is done with LibreOffice rather than a browser-side approximation. Very complex conditional formatting or macros may not be fully supported." }
        ]}
        tips={[
          "Every sheet in your workbook is converted in its original order, each starting on its own page(s).",
          "Wide spreadsheets with many columns convert most cleanly when column widths are set to fit their content before uploading.",
          "LibreOffice-based conversion preserves number formats, formulas' displayed values, and cell borders far more accurately than in-browser rendering.",
          "Simplify complex conditional formatting or macros beforehand, since only standard formatting is guaranteed to carry over."
        ]}
      />
    </div>
  );
}
