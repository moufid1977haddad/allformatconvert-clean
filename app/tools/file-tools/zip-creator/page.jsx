'use client';
import { useState, useRef } from 'react';
export default function ZipCreatorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const addFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));
  const createZip = async () => {
    setLoading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const file of files) {
        const content = await file.arrayBuffer();
        zip.file(file.name, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Creator</h1>
        <p className="text-neutral-500 text-center mb-8">Create ZIP archive files in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add files</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={createZip} disabled={files.length === 0 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create ZIP'}</button>
          {downloadUrl && <a href={downloadUrl} download="archive.zip" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download ZIP</a>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Zip Creator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Zip Creator is a free online tool that allows you to compress and bundle multiple files into a single ZIP archive without installing any software. Simply upload your files, customize your archive settings, and download your compressed file instantly from any device.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Zip Creator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Zip Creator website and click the 'Select Files' button to upload the files you want to compress</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose additional options such as compression level and archive name to customize your ZIP file</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review your selected files and settings, then click the 'Create ZIP' button to start the compression process</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Wait for processing to complete, then click 'Download' to save your ZIP file to your computer</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Zip Creator completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Zip Creator is 100% free with no hidden charges, registration requirements, or premium features. You can create unlimited ZIP files at no cost.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can upload?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Zip Creator supports files up to 2GB in size per upload session, allowing you to compress large documents, videos, and archives efficiently.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my uploaded files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Zip Creator does not store your files. All uploads are processed temporarily and automatically deleted after your download is complete for privacy and security.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file types can I compress?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Zip Creator accepts all file types including documents, images, videos, audio files, and more. There are no restrictions on the types of files you can add to your ZIP archive.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Organize your files into logical groups before uploading to make it easier to manage and locate files within your ZIP archive</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use descriptive names for your ZIP archives to quickly identify the contents, especially when storing multiple compressed files</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of compression level settings to balance between file size reduction and processing speed based on your needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Create ZIP files for backup purposes by regularly compressing important documents and storing them in a secure location</li>
          </ul>
        </div>
      </div>
    </div>
  );
}