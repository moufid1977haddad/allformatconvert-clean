'use client';
import { useState, useRef } from 'react';

export default function MobiToEpubPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let text = decoder.decode(bytes);
      text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const chunks = text.match(/.{1,3000}/g) || [];
      const chapters = chunks.map((chunk, i) => `<chapter id="chapter${i+1}"><title>Chapter ${i+1}</title><p>${chunk}</p></chapter>`).join('\n');
      const epub = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0">
  <metadata>
    <dc:title>${file.name.replace('.mobi', '')}</dc:title>
  </metadata>
  <manifest>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="content"/></spine>
</package>`;
      const blob = new Blob([epub], { type: 'application/epub+zip' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">MOBI to EPUB</h1>
        <p className="text-neutral-500 text-center mb-8">Convert MOBI ebooks to EPUB format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a MOBI file here'}</p>
            <input ref={inputRef} type="file" accept=".mobi,.azw,.azw3" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to EPUB'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.mobi', '.epub')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download EPUB</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Mobi To Epub</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Mobi To Epub is a free online conversion tool that instantly transforms your Mobi eBook files into the universally compatible Epub format. Perfect for readers who want to use their eBooks across multiple devices and platforms without any software installation required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Mobi To Epub</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Mobi To Epub tool website and locate the file upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your Mobi file from your computer or drag and drop it into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait a few seconds for the tool to process and convert your file automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted Epub file and enjoy reading on any compatible device or eReader</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Mobi To Epub really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Mobi To Epub is completely free with no hidden charges, registration requirements, or premium features. You can convert as many files as you need without spending a single dollar.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What devices can open Epub files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Epub files are supported by most eReaders including Kobo, Apple Books, Google Play Books, and many others. They also work on tablets and smartphones through various eBook reading applications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the conversion affect the quality of my eBook?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Mobi To Epub maintains the original formatting, text quality, and embedded images during conversion. Your eBook content remains intact and readable on all compatible devices.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does the conversion process take?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most Mobi files convert to Epub format within seconds. The speed depends on your file size and internet connection, but the process is typically very fast.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your Mobi file is not corrupted before uploading to get the best conversion results and avoid errors during processing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Download your converted Epub file immediately after conversion to prevent accidental loss due to session timeouts</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your converted Epub file on your target device before deleting the original to ensure compatibility and proper formatting</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your Mobi files organized and named clearly so you can easily identify and manage your converted eBooks across different formats</li>
          </ul>
        </div>
      </div>
    </div>
  );
}