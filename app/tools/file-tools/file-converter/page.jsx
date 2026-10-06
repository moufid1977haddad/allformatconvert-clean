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
        description="File Converter re-saves a text file in one of four forms, in your browser. TXT decodes the file in its real encoding (byte-order mark, valid UTF-8, or the Windows code page of your browser language) and writes clean UTF-8. JSON wraps the whole text in a single content field. CSV turns tab-separated lines into comma-separated CSV, with values quoted where needed. HTML escapes the text into the pre block of a minimal page. It does not parse the content: CSV rows do not become JSON records, and HTML tags are not removed."
        howToTitle="How to convert a text file"
        howTo={[
          "Choose a .txt, .csv, .json, .html or .md file.",
          "Pick the target in \"Convert to\": \"TXT\", \"JSON\", \"CSV\" or \"HTML\".",
          "Click \"Convert\".",
          "Click \"Download\": the file keeps its name with the new extension."
        ]}
        specs={[
          { label: "Input formats", value: "TXT, CSV, JSON, HTML, MD" },
          { label: "Output formats", value: "TXT (UTF-8), JSON, CSV, HTML" },
          { label: "Encoding", value: "Detected from the byte-order mark or UTF-8 validity, otherwise the code page of your browser language" },
          { label: "Not done", value: "No parsing: JSON keys, CSV columns and HTML tags are not interpreted" },
          { label: "Size limit", value: "None set; the whole file is read into memory" }
        ]}
        privacy="The file is read, decoded and rewritten by JavaScript on this page; it is not uploaded, and the converted copy is created on your device. When an error is shown, its cleaned text goes to our error log with the tool name and browser version; the file and its name do not."
        faqs={[
          { q: "Can it convert CSV rows into JSON records?", a: "No. The JSON output puts the whole text in one string field called content. For an array with one object per row, use CSV to JSON in Developer Tools." },
          { q: "Can I convert a TSV file to CSV?", a: "Yes. The picker lists only .txt, .csv, .json, .html and .md files, so rename the .tsv file, or switch the picker to all files where your system offers it. Each tab becomes a comma, and values containing commas, double quotes or line breaks are put in quotes." },
          { q: "Will accented characters survive?", a: "Yes in most cases. UTF-8, with or without a BOM, and UTF-16 with a BOM are decoded directly; other files are read with the Windows code page of your browser language, so a file saved by Notepad or Excel on such a system decodes correctly. The result is always UTF-8." },
          { q: "Does it remove HTML tags?", a: "No. Converting an HTML file to TXT keeps its tags as plain text, and converting any file to HTML escapes the less-than, greater-than and ampersand characters so they show as text inside a pre block." }
        ]}
      />
    </div>
  );
}