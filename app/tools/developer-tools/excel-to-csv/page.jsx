'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ExcelToCsvPage() {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const inputRef = useRef();
  const convert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setOutput(XLSX.utils.sheet_to_csv(sheet));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Excel files to CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop an Excel file here</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={convert} />
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Excel to CSV"
        description="Excel to CSV reads an uploaded .xlsx or .xls file using the xlsx library and converts its first sheet to comma-separated CSV text, entirely in your browser — your file is never uploaded to a server. Only the first sheet is converted; there's no sheet picker for workbooks with multiple sheets, and no delimiter options beyond a standard comma."
        howTo={[
          "Click the upload area and select an .xlsx or .xls file.",
          "The first sheet converts automatically — no button click needed.",
          "Review the CSV text in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is my file uploaded to a server?", a: "No, the conversion happens entirely in your browser using the xlsx library." },
          { q: "Can I choose which sheet to convert?", a: "No — only the workbook's first sheet is converted; there's no sheet selector." },
          { q: "Can I download the CSV as a file?", a: "No, there's only a 'Copy' button — paste the copied text into a file yourself if you need one." },
          { q: "Will formatting like colors or fonts carry over?", a: "No, CSV is plain text, so only cell values transfer — formatting, formulas' calculated results (not the formulas themselves as text), and structure like merged cells don't." }
        ]}
        tips={[
          "If your workbook has multiple sheets and you need one other than the first, reorder or duplicate it to the front before uploading.",
          "Merged cells and complex formatting won't survive the conversion — only the underlying values do.",
          "Since it uses a proper spreadsheet-parsing library rather than naive text splitting, values containing commas or quotes are handled correctly.",
          "Copy the result right away, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}