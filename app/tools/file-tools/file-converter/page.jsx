'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { FileDownload } from '../../../components/FileDownload';
import { detectEncoding } from '../../../lib/csvEncoding';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function FileConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('txt');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setDownloadUrl(null); setError(''); if (f && emptyFileProblem(f)) { setFile(null); setError(emptyFileProblem(f, 'convert')); return; } setFile(f); }; // P21: empty file said
  const convert = async () => {
    if (!file) return;
    setError('');
    try {
      // P24 review (03/10): file.text() always decodes UTF-8 — a Windows-1252 text (Notepad, Excel) gave "caf�". The
      // encoding is detected as in the CSV tools (BOM, valid UTF-8, else the ANSI code page of the browser language).
      const bytes = new Uint8Array(await file.arrayBuffer());
      let { encoding } = detectEncoding(bytes);
      // review (03/10): a UTF-8 file with a few bad bytes stays UTF-8 (a handful of \uFFFD), not re-read as Windows-1252
      // throughout ("cafÃ©" everywhere)
      if (encoding !== 'utf-8' && !/^utf-16/.test(encoding)) { const u = new TextDecoder('utf-8').decode(bytes); const bad = (u.match(/\uFFFD/g) || []).length, good = (u.match(/[\u0080-\uFFFC]/g) || []).length; if (good > bad * 20) encoding = 'utf-8'; }
      const text = new TextDecoder(encoding).decode(bytes).replace(/^﻿/, '');
      let content = text;
      let mimeType = 'text/plain';
      if (format === 'json') { try { content = JSON.stringify({ content: text }, null, 2); mimeType = 'application/json'; } catch(e) {} }
      // CSV: tab-separated lines become RFC 4180 CSV. Fields were joined with
      // commas without quoting, so "Smith, John" split into two columns (29/09).
      else if (format === 'csv') {
        const field = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
        content = text.replace(/\r\n?/g, '\n').split('\n').map(l => l.split('\t').map(field).join(',')).join('\r\n');
        mimeType = 'text/csv';
      }
      // HTML: the text is escaped. It was inserted raw, so "a < b" or any tag
      // in the text was interpreted by the browser instead of shown (29/09).
      else if (format === 'html') {
        const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        content = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>' + esc + '</pre></body></html>';
        mimeType = 'text/html';
      }
      const blob = new Blob([content], { type: mimeType });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError('Failed to convert file: ' + (err?.message || 'unknown error'));
      setDownloadUrl(null);
    }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text files to different formats</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a text file" />}</p>
            <input ref={inputRef} type="file" accept=".txt,.csv,.json,.html,.md" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Convert to</label><select aria-label="Convert to" value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option value="txt">TXT</option><option value="json">JSON</option><option value="csv">CSV</option><option value="html">HTML</option></select></div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {downloadUrl && <FileDownload href={downloadUrl} name={file.name.replace(/\.[^.]+$/, '') + '.' + format} />}
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
          { q: "How does the CSV conversion work?", a: "Tab-separated lines become comma-separated CSV following RFC 4180: a value containing a comma, a double quote or a line break is wrapped in double quotes (internal quotes doubled), so it stays in one column in Excel or Google Sheets." }
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