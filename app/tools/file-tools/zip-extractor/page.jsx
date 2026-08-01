'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ZipExtractorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const extract = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
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
      <SeoContent
        title="ZIP Extractor"
        description="ZIP Extractor is a free online tool that extracts files from a ZIP archive directly in your browser using JSZip — no upload, no software required. Upload a .zip file and instantly download its contents."
        howTo={[
          "Click the upload area and select a .zip file from your device.",
          "Wait a moment while the archive is read locally in your browser.",
          "Review the list of files found inside the archive.",
          "Click \"Download\" next to each file to save it to your device."
        ]}
        faqs={[
          { q: "Is ZIP Extractor free to use?", a: "Yes, it's completely free with no signup and no limit on the number of extractions." },
          { q: "What archive formats does ZIP Extractor support?", a: "ZIP (.zip) files only — RAR, 7Z, and TAR archives use different formats and aren't supported by this tool." },
          { q: "Do I need to install any software?", a: "No, ZIP Extractor is a web-based tool that works directly in your browser, so no installation or download is needed." },
          { q: "Is my data private?", a: "Yes. Extraction happens entirely in your browser — the archive is never uploaded to a server." }
        ]}
        tips={[
          "All files in the archive are extracted and listed immediately — there's no need to select files beforehand.",
          "Nested folder paths inside the ZIP are preserved in each file's displayed name.",
          "If extraction fails, confirm the file is a genuine ZIP archive and not a renamed RAR or 7Z file.",
          "Very large archives may take a few seconds to process since everything runs in your browser."
        ]}
      />
    </div>
  );
}