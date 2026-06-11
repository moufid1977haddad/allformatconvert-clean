'use client';
import { useState, useRef } from 'react';
export default function ZipExtractorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const extract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const extracted = [];
      for (const [name, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('blob');
          extracted.push({ name, url: URL.createObjectURL(content), size: content.size });
        }
      }
      setFiles(extracted);
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Extractor</h1>
        <p className="text-neutral-500 text-center mb-8">Extract ZIP archive files in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop a ZIP file here</p>
            <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={extract} />
          </div>
          {loading && <p className="text-center text-neutral-500">Extracting...</p>}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{files.length} file(s) extracted</p>
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <a href={f.url} download={f.name.split('/').pop()} className="text-indigo-400 hover:text-indigo-300 text-sm ml-2">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Zip Extractor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Zip Extractor is a free online tool that allows you to extract files from ZIP archives directly in your browser without downloading software. It supports multiple compressed file formats and makes file extraction quick, easy, and accessible from any device.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Zip Extractor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Zip Extractor website and click the 'Choose File' button to select your ZIP archive from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the file to upload and process - the tool will automatically detect and display all files contained within the archive</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview files before extraction or select specific files you want to download individually</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button next to each file or extract all files at once to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Zip Extractor free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Zip Extractor is completely free with no hidden fees, registration requirements, or limits on the number of extractions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Zip Extractor support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Zip Extractor supports ZIP, RAR, 7Z, TAR, GZIP, and other common compressed file formats for extraction.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Zip Extractor?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Zip Extractor is a web-based tool that works directly in your browser, so no installation or software download is needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using Zip Extractor?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, files are processed securely in your browser and are not stored on our servers after extraction is complete.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to quickly check file contents before extracting to save time and storage space</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For large ZIP files, extract only the files you need rather than extracting everything at once</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If extraction fails, try re-uploading the file as it may have been corrupted during the initial upload</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Organize extracted files into folders immediately to keep your downloads organized and easy to locate</li>
          </ul>
        </div>
      </div>
    </div>
  );
}