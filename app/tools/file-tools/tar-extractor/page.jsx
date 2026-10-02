'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { readTar, TarFormatError } from '../../../lib/tarReader';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
// 30/09 (real Safari 17.6 on the Mac): "t.tar.gz" could not be selected ("One or more files could not be selected")
// while "t.tgz" could. Safari and the macOS/iOS pickers match a file by its LAST extension only ("gz"), so a
// double extension such as ".tar.gz" in `accept` never matches. Single extensions + the MIME types the systems
// give these files (ezyZip and the ZIP Extractor accept any archive the same way); Chrome and Firefox also
// match ".gz" against "t.tar.gz". A .gz that holds something other than a TAR is refused with its own message.
const TAR_ACCEPT = '.tar,.tgz,.gz,.taz,application/x-tar,application/x-gtar,application/gzip,application/x-gzip,application/x-compressed-tar';

export default function TarExtractorPage() {
  const [skippedNote, setSkippedNote] = useState(''); // P24: links and sparse files that are not extracted are listed
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const extract = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (emptyFileProblem(file)) { setFiles([]); setError(emptyFileProblem(file, 'extract')); return; } // P21
    setLoading(true);
    setError('');
    setFiles([]);
    try {
      let bytes = new Uint8Array(await file.arrayBuffer());
      const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
      if (isGzip) {
        const decompressedStream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        bytes = new Uint8Array(await new Response(decompressedStream).arrayBuffer());
      }
      let entries;
      try { entries = readTar(bytes); } catch (err) {
        // A .gz of a single file (notes.txt.gz), not of a TAR archive
        if (isGzip && err instanceof TarFormatError && /not a valid TAR/.test(err.message)) throw new TarFormatError('This .gz file holds a single compressed file, not a TAR archive. Open it with the ZIP Extractor (File Tools), which unpacks .gz, .bz2, .xz and .zst files.');
        throw err;
      }
      if (entries.length === 0) setError('This archive contains no files (only folders or links).');
      setFiles(entries.map(({ name, data }) => ({ name, url: URL.createObjectURL(new Blob([data])), size: data.length })));
      setSkippedNote(entries.skipped?.length ? `Not extracted (${entries.skipped.length}): ${entries.skipped.slice(0, 5).join('; ')}${entries.skipped.length > 5 ? '…' : ''}.` : '');
    } catch (err) {
      setError(err instanceof TarFormatError ? err.message : 'This file could not be read as a TAR archive: ' + (err?.message || String(err)));
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TAR Extractor</h1>
        <p className="text-neutral-500 text-center mb-8">Extract TAR archive files in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop a .tar, .tar.gz, or .tgz file here</p>
            <input ref={inputRef} type="file" accept={TAR_ACCEPT} className="hidden" onChange={extract} />
          </div>
          {loading && <p className="text-center text-neutral-500">Extracting...</p>}
          {error && <p role="alert" className="text-center text-red-500 text-sm">{error}</p>}
          {skippedNote && <p className="text-center text-amber-700 text-sm" data-tar-skipped>{skippedNote}</p>}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{files.length} file(s) extracted</p>
              <DownloadGroup zipName="extracted-files.zip">
                {files.map((f, i) => (
                  <FileDownload key={i} href={f.url} name={f.name.split('/').pop()} note={f.name.includes('/') ? f.name : undefined} />
                ))}
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="TAR Extractor"
        description="TAR Extractor is a free online tool that extracts files from TAR archives — including gzip-compressed .tar.gz and .tgz — directly in your browser, no software or upload required. Upload a .tar, .tar.gz, or .tgz file to instantly see and download its contents."
        howTo={[
          "Click the upload area and select a .tar, .tar.gz, or .tgz file from your device.",
          "Wait a moment while the archive is decompressed (if needed) and parsed locally in your browser.",
          "Review the list of extracted files with their names.",
          "Click \"Download\" next to each file to save it individually."
        ]}
        faqs={[
          { q: "What archive formats does TAR Extractor support?", a: "Plain TAR (.tar) files, as well as gzip-compressed TAR archives (.tar.gz and .tgz), which are decompressed automatically in your browser. For .tar.bz2, .tar.xz and .tar.zst, use our ZIP Extractor (File Tools), which opens them in your browser too." },
          { q: "Are long paths and accented file names kept?", a: "Yes. Archives made by GNU tar, macOS tar, Windows tar.exe or Python store long paths and non-ASCII names in extra header records (PAX or GNU long names); those records are read and applied, never offered as files of their own. Folders and links are skipped; only real files are listed." },
          { q: "Is my uploaded file private?", a: "Yes. The archive is decompressed and parsed entirely in your browser — nothing is uploaded to a server." },
          { q: "Do I need to install any software?", a: "No, TAR Extractor works directly in your web browser on any device without additional software installation." },
          { q: "Is there a file size limit?", a: "No hard limit is enforced, but very large archives depend on your browser's available memory since parsing happens locally." }
        ]}
        tips={[
          "TAR Extractor decompresses .tar.gz and .tgz automatically — no need to decompress them yourself first.",
          "If your file is .tar.bz2, .tar.xz or .tar.zst, open it with the ZIP Extractor (File Tools) instead.",
          "Files are listed as soon as extraction finishes — download the ones you need individually.",
          "Very large TAR archives may take a few seconds to parse since everything runs in your browser.",
          "If extraction returns no files, double-check the archive is a standard TAR (or gzip-compressed TAR) and not corrupted."
        ]}
      />
    </div>
  );
}