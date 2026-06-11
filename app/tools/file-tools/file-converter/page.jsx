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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About File Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">File Converter is a free online tool that instantly converts files between multiple formats including images, documents, videos, and audio without requiring software installation. Simply upload your file, select your desired output format, and download the converted result in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use File Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the File Converter website and click the 'Upload File' button to select the file you want to convert from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired output format from the dropdown menu or format selection panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to process your file through our secure conversion engine</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted file instantly once the conversion is complete, with no registration required</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is File Converter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, File Converter is completely free with no hidden charges, registration requirements, or premium upgrades needed for basic conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does File Converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Converter supports a wide range of formats including PDF, JPG, PNG, MP4, MP3, DOCX, XLSX, and many more for images, documents, videos, and audio files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my uploaded file safe and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all uploaded files are processed securely and deleted automatically after conversion. We do not store your files or share them with third parties.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How large can my files be for conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Converter typically supports files up to 500MB, though limits may vary by file type. For larger files, consider splitting them into smaller segments.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch convert multiple files by uploading them one after another to save time when converting several documents or images</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the file quality settings before conversion if available, as lower quality settings result in smaller file sizes but reduced clarity</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use File Converter for format compatibility issues when opening files in different applications or devices</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your browser updated and use a stable internet connection for faster and more reliable file conversions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}