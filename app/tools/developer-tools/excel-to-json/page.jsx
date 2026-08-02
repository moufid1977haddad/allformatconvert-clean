'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ExcelToJsonPage() {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const inputRef = useRef();
  const convert = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setStatus('Converting...');
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const result = {};
      workbook.SheetNames.forEach(name => { result[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]); });
      setOutput(JSON.stringify(result, null, 2));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Excel files to JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop an Excel file here</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={convert} />
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Excel to JSON"
        description="Excel to JSON reads an uploaded .xlsx, .xls, or .csv file using the xlsx library and converts every sheet to an array of row objects, entirely in your browser — your file is never uploaded to a server. The result is a single JSON object keyed by sheet name, with each sheet's first row used as the property names for that sheet's rows."
        howTo={[
          "Click the upload area and select an .xlsx, .xls, or .csv file.",
          "Conversion runs automatically — no button click needed.",
          "Review the JSON in the output box, organized by sheet name.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What file formats does it support?", a: ".xlsx, .xls, and .csv." },
          { q: "Is my file uploaded to a server?", a: "No, conversion happens entirely in your browser using the xlsx library." },
          { q: "Can I convert multiple sheets at once?", a: "Yes — every sheet in the workbook is converted automatically, each becoming its own array under a key named after the sheet. There's no option to merge sheets or select specific ones." },
          { q: "Can I download the JSON as a file?", a: "No, there's only a 'Copy' button — paste the copied text into a file yourself if you need one." }
        ]}
        tips={[
          "Each sheet's first row becomes the property names for that sheet's row objects, so make sure your headers are in row 1.",
          "Empty cells are simply omitted from that row's object rather than appearing as null — account for that if your code expects every key present.",
          "For workbooks with many sheets, the output can get large; use the Copy button and inspect it in a code editor for easier reading.",
          "Since it uses a proper spreadsheet-parsing library, formulas convert to their calculated values, not the formula text."
        ]}
      />
    </div>
  );
}