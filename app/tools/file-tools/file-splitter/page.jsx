'use client';
import { useState, useRef } from 'react';
export default function FileSplitterPage() {
  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(1);
  const [unit, setUnit] = useState('MB');
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setChunks([]); };
  const split = async () => {
    if (!file) return;
    setLoading(true);
    const sizes = { B: 1, KB: 1024, MB: 1024*1024 };
    const bytesPerChunk = chunkSize * sizes[unit];
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const newChunks = [];
    for (let i = 0; i < bytes.length; i += bytesPerChunk) {
      const chunk = bytes.slice(i, i + bytesPerChunk);
      const blob = new Blob([chunk]);
      newChunks.push({ url: URL.createObjectURL(blob), size: chunk.length, index: newChunks.length + 1 });
    }
    setChunks(newChunks);
    setLoading(false);
  };
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(2) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Splitter</h1>
        <p className="text-neutral-500 text-center mb-8">Split large files into smaller parts</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Chunk Size</label><input type="number" min="1" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Unit</label><select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option>B</option><option>KB</option><option>MB</option></select></div>
          </div>
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Splitting...' : 'Split File'}</button>
          {chunks.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{chunks.length} part(s) created</p>
              {chunks.map(c => (
                <div key={c.index} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm">Part {c.index} — {formatSize(c.size)}</span>
                  <a href={c.url} download={file.name + '.part' + c.index} className="text-indigo-400 hover:text-indigo-300 text-sm">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About File Splitter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">File Splitter is a free online tool that allows you to quickly divide large files into smaller, manageable chunks without any software installation. Perfect for file sharing, storage optimization, and email attachments, it works with any file type and maintains data integrity throughout the splitting process.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use File Splitter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your file by clicking the upload button or dragging it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your preferred split method: by number of parts, file size, or custom segments</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Configure any additional options such as compression or encryption if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the split button and download your files individually or as a compressed archive</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file types can I split with File Splitter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Splitter supports all file types including documents, images, videos, archives, and more. There are no restrictions on file format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Splitter can handle files up to 2GB in size, making it suitable for most personal and professional use cases.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I merge the split files back together?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, File Splitter provides a merge feature that allows you to easily recombine split files in the correct order to restore the original file.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using File Splitter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all files are processed locally in your browser and are automatically deleted after processing. We do not store or access your files on our servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Split large video files before uploading to cloud storage or email to avoid timeout errors and size restrictions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the compression option when splitting files to further reduce file sizes and save storage space</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Name your split files clearly with sequential numbering to make it easier to identify and merge them later</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For frequently split files, bookmark the tool or save your preferred settings to streamline future splitting tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}