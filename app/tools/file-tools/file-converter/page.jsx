'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
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
          {downloadUrl && <a href={downloadUrl} download={file.name.replace(/\.[^.]+$/, '') + '.' + format} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>}
        </div>
      </div>
      <SeoContent
        title="File Converter"
        description="File Converter is a free online tool that converts plain-text-based files between TXT, JSON, CSV, and HTML formats — entirely in your browser, with nothing uploaded to a server. It's a quick way to reformat text data or make it compatible with another tool or workflow."
        howTo={[
          "Click the upload area and select a text-based file (.txt, .csv, .json, .html, or .md).",
          "Choose your target format from the dropdown: TXT, JSON, CSV, or HTML.",
          "Click \"Convert\" to transform the file's content locally.",
          "Click \"Download\" to save the converted file."
        ]}
        faqs={[
          { q: "Is File Converter free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can convert." },
          { q: "What formats does File Converter support?", a: "Text-based formats only: it accepts .txt, .csv, .json, .html, and .md files, and converts between TXT, JSON, CSV, and HTML. It does not convert images, video, audio, or PDFs." },
          { q: "Is my file uploaded anywhere?", a: "No. The conversion runs entirely in your browser — your file is never sent to a server." },
          { q: "How does the CSV conversion work?", a: "It's a simple tab-to-comma replacement. For complex spreadsheet data with embedded commas or quotes, a dedicated spreadsheet tool will give more reliable results." }
        ]}
        tips={[
          "JSON output wraps your file's text in a {\"content\": \"...\"} object rather than parsing it into structured data.",
          "HTML conversion wraps your text in a basic <pre> tag — it won't add rich formatting or document structure.",
          "For binary files like images, PDFs, or Word documents, use a format-specific converter instead — this tool works with plain text content only.",
          "Double-check your file has one of the supported extensions (.txt, .csv, .json, .html, .md) before uploading."
        ]}
      />
    </div>
  );
}