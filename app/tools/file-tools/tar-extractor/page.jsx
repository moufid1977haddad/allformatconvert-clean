'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { readTar, TarFormatError } from '../../../lib/tarReader';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
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
  const [error, setError] = useToolError('');
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
            <p className="text-neutral-500"><UploadPrompt what="a .tar, .tar.gz, or .tgz file" /></p>
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
        description="TAR Extractor opens plain .tar archives and gzip-compressed ones (.tar.gz, .tgz) in your browser and lists every file with its folder path. It reads the ustar prefix, PAX extended headers and GNU long-name records, so long paths and accented names come out complete. Hard links are extracted as copies of their target; symbolic links and GNU sparse files are listed as not extracted. Folders are not offered as files. For .tar.bz2, .tar.xz, .tar.zst, or a .gz holding a single file, use ZIP Extractor instead."
        howToTitle="How to extract a TAR or TAR.GZ file"
        howTo={[
          "Choose a .tar, .tar.gz or .tgz file; extraction starts at once.",
          "Wait for \"Extracting...\" to end, then read the list of files, with the folder path shown under each name.",
          "Click \"Download\" next to a file, or \"Download all\" to get every file in one ZIP."
        ]}
        specs={[
          { label: "Input", value: "TAR, TAR.GZ, TGZ (gzip compression only)" },
          { label: "Output", value: "The original files, one by one or together in extracted-files.zip" },
          { label: "Not extracted", value: "Symbolic links and GNU sparse files (listed), folders and devices" },
          { label: "Size limit", value: "None set; the archive is read and decompressed in memory" }
        ]}
        privacy="The archive is decompressed with the DecompressionStream of your browser and read by this page; it is not uploaded, and the extracted files are made on your device. An error message, if one appears, is logged for us cleaned of names, along with the tool and browser names; the archive is never sent."
        faqs={[
          { q: "Can it open .tar.bz2 or .tar.xz files?", a: "No. This tool decompresses gzip only. ZIP Extractor in File Tools opens .tar.bz2, .tar.xz and .tar.zst, as well as RAR and 7Z archives, in your browser too." },
          { q: "Are long paths and accented names kept?", a: "Yes. PAX extended headers and GNU long-name records are read and applied to the next file, so names longer than the 100 bytes of the basic header field and non-ASCII names come out complete; those records are never offered as files." },
          { q: "Are links extracted?", a: "Yes for hard links: each comes out as a copy of the file it points to. No for symbolic links: they are listed under \"Not extracted\" with their target, like GNU sparse files." },
          { q: "Can it open a single .gz file?", a: "No. A .gz that holds one compressed file rather than a TAR archive is refused with a message pointing to ZIP Extractor, which unpacks single .gz, .bz2, .xz and .zst files." }
        ]}
      />
    </div>
  );
}