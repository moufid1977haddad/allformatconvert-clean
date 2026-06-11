'use client';
import { useState, useRef } from 'react';

export default function EpubToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const JSZip = (await import('jszip')).default;
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let allHtml = '';
      const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'));
      if (opfFile) {
        const opfContent = await zip.files[opfFile].async('text');
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, 'application/xml');
        const items = opfDoc.querySelectorAll('item');
        const htmlFiles = [];
        items.forEach(item => {
          const mt = item.getAttribute('media-type');
          if (mt && (mt.includes('html') || mt.includes('xhtml'))) {
            const href = item.getAttribute('href');
            const basePath = opfFile.substring(0, opfFile.lastIndexOf('/') + 1);
            htmlFiles.push(basePath + href);
          }
        });
        for (const hf of htmlFiles) {
          if (zip.files[hf]) {
            const content = await zip.files[hf].async('text');
            const doc = parser.parseFromString(content, 'text/html');
            allHtml += doc.body.innerHTML + '<hr>';
          }
        }
      }
      if (!allHtml) {
        const htmlFiles = Object.keys(zip.files).filter(f => f.endsWith('.html') || f.endsWith('.xhtml'));
        for (const hf of htmlFiles) {
          const content = await zip.files[hf].async('text');
          allHtml += content + '<hr>';
        }
      }
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>EPUB</title><style>body{font-family:Georgia,serif;margin:40px;line-height:1.8;color:#000;max-width:800px;margin:auto;}h1,h2,h3{color:#000;}hr{border:none;border-top:1px solid #ccc;margin:30px 0;}</style></head><body>' + allHtml + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 800);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">EPUB to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert EPUB ebooks to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an EPUB file here'}</p>
            <input ref={inputRef} type="file" accept=".epub" className="hidden" onChange={handleFile} />
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
    </div>
  );
}
