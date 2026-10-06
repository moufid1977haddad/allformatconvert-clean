'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_TOTAL_SIZE_BYTES, MAX_TOTAL_SIZE_LABEL, MOBILE_MAX_TOTAL_SIZE_BYTES, MOBILE_MAX_TOTAL_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

export default function ZipCreatorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useToolError('');
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(6);
  // P24 (03/10): optional password, AES-256 (zipCreator.worker.js)
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const pwProblem = usePassword ? (!password ? 'Type a password.' : password !== password2 ? 'The two passwords differ.' : '') : '';
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const maxTotalBytes = isMobile ? MOBILE_MAX_TOTAL_SIZE_BYTES : MAX_TOTAL_SIZE_BYTES;
  const maxTotalLabel = isMobile ? MOBILE_MAX_TOTAL_SIZE_LABEL : MAX_TOTAL_SIZE_LABEL;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const overSizeLimit = totalSize > maxTotalBytes;

  const addFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
    setStatus('');
    setDownloadUrl(null);
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setStatus('Canceled.');
  };

  const createZip = () => {
    if (files.length === 0) return;
    if (overSizeLimit) { setError(`These files add up to ${formatBytes(totalSize)}, over the ${maxTotalLabel} limit${isMobile ? ' on this device' : ''}. Remove a file or zip in smaller batches.`); return; }
    setLoading(true);
    setError('');
    setStatus('');
    setProgress(0);
    setDownloadUrl(null);

    const worker = new Worker(new URL('./zipCreator.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'done') {
        setProgress(100);
        setLoading(false);
        workerRef.current = null;
        setDownloadUrl(URL.createObjectURL(msg.blob));
        setStatus(`Zipped ${msg.fileCount} file${msg.fileCount > 1 ? 's' : ''}.`);
      } else if (msg.type === 'limit') {
        setLoading(false);
        workerRef.current = null;
        setError(msg.message + ' Remove a file or zip in smaller batches.');
      } else if (msg.type === 'error') {
        setLoading(false);
        workerRef.current = null;
        setError('Error: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setLoading(false);
      workerRef.current = null;
      setError('Error: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ files, maxTotalBytes, compressionLevel, password: usePassword ? password : '' });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Creator</h1>
        <p className="text-neutral-500 text-center mb-2">Create ZIP archive files in your browser</p>
        <p className="text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports up to {maxTotalLabel} total{isMobile ? ' on this device' : ''}. Zipping runs in the background — this tab stays responsive.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add files</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} disabled={loading} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} disabled={loading} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
              <p className={`text-xs text-right ${overSizeLimit ? 'text-red-500' : 'text-neutral-400'}`}>{formatBytes(totalSize)} total</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="compression-level" className="text-sm text-neutral-600">Compression level</label>
            <select
              id="compression-level"
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(Number(e.target.value))}
              disabled={loading}
              className="min-w-0 max-w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-neutral-100"
            >
              <option value={0}>None (store only, fastest)</option>
              <option value={1}>Fast (lower compression)</option>
              <option value={6}>Normal (balanced, default)</option>
              <option value={9}>Best (smallest file, slowest)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input id="zip-use-password" type="checkbox" checked={usePassword} onChange={(e) => setUsePassword(e.target.checked)} disabled={loading} /> Protect with a password (AES-256)
            </label>
            {usePassword && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input id="zip-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="Password" aria-label="Password" className="border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                <input id="zip-password2" type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} disabled={loading} placeholder="Repeat the password" aria-label="Repeat the password" className="border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                <p className="sm:col-span-2 text-xs text-neutral-500">{pwProblem || (/[^ -~]/.test(password) ? 'This password has accented or non-Latin characters: zip.js writes them as UTF-8, but some programs read them in another encoding and then refuse the password (bsdtar on Windows did in our test). Letters, digits and punctuation of an English keyboard are the safest. ' : '') + 'Encrypted as AES-256 in the WinZip AE-2 format; in our test, bsdtar (libarchive) opened it. The password is not stored or sent anywhere: if it is lost, the files cannot be recovered. File names stay readable in a ZIP; only the contents are encrypted.'}</p>
              </div>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Zipping…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={createZip} disabled={files.length === 0 || !!pwProblem} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Create ZIP</button>
          )}
          {status && !loading && <p className="text-center text-sm text-green-600">{status}</p>}
          {downloadUrl && !loading && <FileDownload href={downloadUrl} name="archive.zip" />}
        </div>
      </div>
      <SeoContent
        title="ZIP Creator"
        description="ZIP Creator puts several files into one ZIP archive inside your browser, in a background worker so the page stays usable, with a progress bar and a Cancel button. You choose the compression level, from store-only to the strongest DEFLATE setting. An optional password encrypts the contents with AES-256 (WinZip AE-2), never the weak old ZipCrypto; file names stay readable, as in every ZIP. Files are placed at the root of the archive under their own names, without folders. The archive is always called archive.zip."
        howToTitle="How to create a ZIP file"
        howTo={[
          "Click \"Click to add files\" and choose the files; add more the same way.",
          "Take out a wrong file with \"Remove\".",
          "Pick the \"Compression level\".",
          "To protect the archive, tick \"Protect with a password (AES-256)\" and type it in \"Password\" and \"Repeat the password\".",
          "Click \"Create ZIP\", then \"Download\" to save archive.zip."
        ]}
        specs={[
          { label: "Total size on a computer", value: `Up to ${MAX_TOTAL_SIZE_LABEL} for all files together` },
          { label: "On phones and tablets", value: `Up to ${MOBILE_MAX_TOTAL_SIZE_LABEL} in total` },
          { label: "Compression", value: "Store only, or DEFLATE at level 1, 6 (the default) or 9" },
          { label: "Encryption", value: "Optional AES-256 in the WinZip AE-2 format; file names are not encrypted" },
          { label: "Output", value: "archive.zip, with every file at its root" }
        ]}
        privacy="The archive is built in a Web Worker in your browser, with JSZip, or with zip.js when a password is set; the files are not uploaded. The password is used inside that worker and not stored, so a lost password cannot be recovered. A failed archive leaves one cleaned error line in our log, naming the tool and your browser; the files themselves never travel."
        faqs={[
          { q: "Can other programs open a password-protected ZIP made here?", a: "Yes, programs that read AES-encrypted ZIP files in the WinZip AE-2 format can. In our test, bsdtar (libarchive) extracted such an archive byte for byte and refused a wrong password. Accented passwords may be read differently by some programs, so letters, digits and English punctuation are the safest." },
          { q: "Is there a size limit?", a: `Yes: ${MAX_TOTAL_SIZE_LABEL} in total on a computer and ${MOBILE_MAX_TOTAL_SIZE_LABEL} on phones and tablets. The archive is built in the memory of the browser tab, and these caps keep the tab from running out of it.` },
          { q: "Does compression help for photos and videos?", a: "No, very little: JPG, MP4 and ZIP files are already compressed, so the store-only level is quicker and the archive barely grows. Text, CSV files and uncompressed images shrink much more at the stronger levels." },
          { q: "Can I add folders?", a: "No. Files are added one by one and stored at the root of the archive under their own names. Rename files that share a name before adding them, so each one keeps its own entry." }
        ]}
      />
    </div>
  );
}
