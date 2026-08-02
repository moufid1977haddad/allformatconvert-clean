'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// RFC 4180-style CSV parser: splitting on plain commas/newlines breaks the
// moment a quoted field contains one of those characters (e.g. "Smith, John")
// — the field gets sliced apart into extra columns instead of staying intact.
// This tracks quote state so commas and newlines inside a quoted field are
// treated as literal data, and a doubled "" inside a quoted field is
// unescaped to a single ".
function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export default function CsvToExcelPage() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const convert = async () => {
    if (!input) return;
    setStatus('Converting...');
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const ws = XLSX.utils.aoa_to_sheet(parseCsvRows(input));
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
        description="CSV to Excel builds an .xlsx workbook from pasted CSV text using the xlsx library entirely in your browser, then triggers a download — your data is never uploaded to a server. CSV parsing is quote-aware: a field wrapped in double quotes can safely contain a comma or a newline (like 'Smith, John') without being split into extra columns, and a doubled double-quote inside a quoted field is unescaped to a single quote."
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
          { q: "Does it handle CSV values that contain commas, like quoted fields?", a: "Yes — a value wrapped in double quotes (e.g. \"Smith, John\") is parsed as a single field and its comma is preserved intact, rather than being split into extra columns." }
        ]}
        tips={[
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and stay in a single cell.",
          "The first line becomes the first row of the sheet as-is — include a header row yourself if you want column labels.",
          "Check the downloaded file's column alignment for CSVs with unusual formatting before relying on it.",
          "Only comma is recognized as a delimiter — a CSV using semicolons or tabs instead needs to be converted to commas first."
        ]}
      />
    </div>
  );
}