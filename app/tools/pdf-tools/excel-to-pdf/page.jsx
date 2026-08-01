'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let allHtml = '';
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        allHtml += '<h2>' + sheetName + '</h2>' + html;
      });
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#000;font-size:12px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px 8px;}tr:first-child{background:#e0e0e0;font-weight:bold;}</style></head><body>' + allHtml + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 500);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .xlsx .xls .csv to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an Excel file here'}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {done && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">Done!</div>
              <p className="text-neutral-500 text-sm">Use Save as PDF in the print dialog.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Excel to PDF"
        description="Excel to PDF reads every sheet in your spreadsheet and renders them as HTML tables in a new browser tab, entirely on your device — your file is never uploaded to a server. It doesn't generate a PDF file directly: instead, it opens your browser's print dialog, where you choose 'Save as PDF' to produce the actual file."
        howTo={[
          "Click the upload area and select an .xlsx, .xls, or .csv file from your device.",
          "Click 'Convert to PDF' — a new tab opens with your spreadsheet as tables and the browser's print dialog appears.",
          "In the print dialog, choose 'Save as PDF' (or your OS equivalent) as the destination.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Excel to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does the tool support?", a: "It accepts .xlsx, .xls, and .csv files." },
          { q: "Will my files be uploaded to a server?", a: "No. The spreadsheet is read and rendered entirely in your browser — it's never uploaded anywhere." },
          { q: "Can I convert multiple Excel files at once?", a: "No, only one file can be converted at a time." }
        ]}
        tips={[
          "Every sheet in your workbook is rendered as its own table with a heading, in your workbook's original sheet order.",
          "In the print dialog, switch to landscape orientation for spreadsheets with many columns so they fit on the page.",
          "If a table looks cut off, adjust the print scale or margins in the print dialog before saving.",
          "Simplify complex formulas or conditional formatting beforehand, since only the displayed cell values are rendered."
        ]}
      />
    </div>
  );
}