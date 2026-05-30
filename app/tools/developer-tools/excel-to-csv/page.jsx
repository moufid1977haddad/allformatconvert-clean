'use client';
import { useState, useRef } from 'react';
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
    </div>
  );
}