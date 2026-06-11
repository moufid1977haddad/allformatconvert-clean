'use client';
import { useState, useRef } from 'react';
export default function FileConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('txt');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setDownloadUrl(null); };
  const convert = async () => {
    if (!file) return;
    const text = await file.text();
    let content = text;
    let mimeType = 'text/plain';
    if (format === 'json') { try { content = JSON.stringify({ content: text }, null, 2); mimeType = 'application/json'; } catch(e) {} }
    else if (format === 'csv') { content = text.split('\n').map(l => l.split('\t').join(',')).join('\n'); mimeType = 'text/csv'; }
    else if (format === 'html') { content = '<!DOCTYPE html><html><body><pre>' + text + '</pre></body></html>'; mimeType = 'text/html'; }
    const blob = new Blob([content], { type: mimeType });
    setDownloadUrl(URL.createObjectURL(blob));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text files to different formats</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a text file here'}</p>
            <input ref={inputRef} type="file" accept=".txt,.csv,.json,.html,.md" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Convert to</label><select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option value="txt">TXT</option><option value="json">JSON</option><option value="csv">CSV</option><option value="html">HTML</option></select></div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
          {downloadUrl && <a href={downloadUrl} download={file.name.replace(/.[^.]+$/, '') + '.' + format} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>}
        </div>
      </div>
    </div>
  );
}