'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ZipCreatorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const addFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
  };
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
      <SeoContent
        title="ZIP Creator"
        description="ZIP Creator is a free online tool that bundles multiple files into a single ZIP archive, entirely in your browser using JSZip — no upload, no software, and works with any file type."
        howTo={[
          "Click the upload area and select one or more files to add to your archive.",
          "Remove any files you don't want by clicking \"Remove\" next to them.",
          "Click \"Create ZIP\" to bundle everything into a single archive locally.",
          "Click \"Download ZIP\" to save the resulting archive.zip file."
        ]}
        faqs={[
          { q: "Is ZIP Creator free to use?", a: "Yes, it's completely free with no signup and no limit on how many ZIP files you can create." },
          { q: "What file types can I zip?", a: "Any file type — there are no format restrictions since files are added to the archive as-is." },
          { q: "Do you store my uploaded files?", a: "No. The ZIP is built entirely in your browser — files are never uploaded to a server." },
          { q: "Can I rename the archive or set a compression level?", a: "Not currently — the tool creates a file named archive.zip using JSZip's default settings." }
        ]}
        tips={[
          "Add all the files you need before clicking \"Create ZIP\" — use the Remove button to fix any mistakes first.",
          "Large batches of files may take longer to process since compression runs in your browser.",
          "Rename the downloaded archive.zip file afterward if you need a more descriptive name.",
          "Great for bundling multiple documents or images into a single file before emailing or uploading elsewhere."
        ]}
      />
    </div>
  );
}