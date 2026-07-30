'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function CsvToExcelPage() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const convert = async () => {
    if (!input) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const ws = XLSX.utils.aoa_to_sheet(input.split('\n').map(r => r.split(',')));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'converted.xlsx');
      setStatus('Downloaded!');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to Excel</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to Excel format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={convert} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert and Download</button>
          {status && <p className="text-center text-green-400">{status}</p>}
        </div>
      </div>
      <SeoContent
        title="CSV to Excel"
        description="CSV to Excel builds an .xlsx workbook from pasted CSV text using the xlsx library entirely in your browser, then triggers a download — your data is never uploaded to a server. Rows and columns are split on newlines and plain commas; it doesn't handle quoted fields that contain commas, like a value such as Smith, John wrapped in quotes, so such fields will be split into extra columns."
        howTo={[
          "Paste your CSV text into the input box (there's no file upload — paste the contents directly).",
          "Click 'Convert and Download' to build the workbook and save it.",
          "The file downloads automatically as converted.xlsx.",
          "Open it in Excel or any compatible spreadsheet app."
        ]}
        faqs={[
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload." },
          { q: "What output format does it produce?", a: "Always .xlsx. There's no .xls (legacy Excel) option." },
          { q: "Is my data uploaded to a server?", a: "No, the workbook is built entirely in your browser using the xlsx library." },
          { q: "Does it handle CSV values that contain commas, like quoted fields?", a: "No — splitting is done on plain commas, so a quoted value containing a comma (e.g. \"Smith, John\") will be split into two columns instead of staying in one." }
        ]}
        tips={[
          "Avoid commas inside individual values, since quoted fields with embedded commas aren't parsed correctly and will shift into extra columns.",
          "The first line becomes the first row of the sheet as-is — include a header row yourself if you want column labels.",
          "Check the downloaded file's column alignment for CSVs with unusual formatting before relying on it.",
          "For CSVs with quoted or comma-containing fields, clean them up (e.g. replace commas with another separator) before pasting."
        ]}
      />
    </div>
  );
}