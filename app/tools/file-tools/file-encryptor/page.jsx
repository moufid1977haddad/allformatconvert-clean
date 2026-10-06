'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { encryptBytes, decryptBytes } from '../../../lib/textCrypto';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function FileEncryptorPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [mode, setMode] = useState('encrypt');
  const [note, setNote] = useState('');
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setDownloadUrl(null); setError(''); if (f && emptyFileProblem(f)) { setFile(null); setError(emptyFileProblem(f, mode === 'encrypt' ? 'encrypt' : 'decrypt')); return; } setFile(f); }; // P21: empty file said
  const process = async () => {
    if (!file || !password) return;
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setNote('');
      if (mode === 'encrypt') {
        setDownloadUrl(URL.createObjectURL(new Blob([await encryptBytes(bytes, password)])));
      } else {
        const r = await decryptBytes(bytes, password);
        if (r.legacy) setNote('This file was not encrypted with AES by this tool: it was decrypted with the old XOR method used before 29 September 2026, which cannot tell whether the password is right. If the result does not open, the password was wrong. Encrypt it again to protect it with AES-256.');
        setDownloadUrl(URL.createObjectURL(new Blob([r.bytes])));
      }
    } catch(e) { setDownloadUrl(null); setNote(e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Encryptor</h1>
        <p className="text-neutral-500 text-center mb-8">Encrypt and decrypt files with a password</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode('encrypt')} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'encrypt' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100'}`}>Encrypt</button>
            <button onClick={() => setMode('decrypt')} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'decrypt' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100'}`}>Decrypt</button>
          </div>
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a file" />}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter password..." /></div>
          <button onClick={process} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {note && <p className="text-amber-700 text-sm text-center">{note}</p>}
          {downloadUrl && <FileDownload href={downloadUrl} name={mode === 'encrypt' ? file.name + '.encrypted' : (file.name.endsWith('.encrypted') ? file.name.slice(0, -10) : file.name + '.decrypted')} />}
        </div>
      </div>
      <SeoContent
        title={"File Encryptor"}
        description={"File Encryptor protects one file with a password. Encrypt derives a key from your password with PBKDF2-SHA-256 and 600,000 iterations, adds a fresh random salt and IV, and seals the file with AES-256-GCM through the Web Crypto API of your browser; the result is saved as name.encrypted. Decrypt reverses it and gives the original name back when the file ends in .encrypted; otherwise .decrypted is added. GCM checks integrity, so a wrong password or a damaged file is refused. Files made by the older XOR version of this tool, which have no such check, can still be opened."}
        howToTitle={"How to encrypt a file with a password"}
        howTo={[
          "Choose \"Encrypt\" or \"Decrypt\".",
          "Choose the file: any file to encrypt, or a .encrypted file to decrypt.",
          "Type the password in \"Password\".",
          "Click \"Encrypt File\" or \"Decrypt File\".",
          "Click \"Download\": you get name.encrypted, or, when decrypting, the name without .encrypted."
        ]}
        specs={[
          { label: "Algorithm", value: "AES-256-GCM, key from PBKDF2-SHA-256 with 600,000 iterations" },
          { label: "Output", value: "name.encrypted, 48 bytes larger than the original" },
          { label: "Added data", value: "A short marker, a random salt and IV, and the GCM authentication tag" },
          { label: "Accepted files", value: "Any type" },
          { label: "Size limit", value: "None set; the whole file is held in memory while it is processed" }
        ]}
        privacy={"Encryption and decryption run in your browser through the Web Crypto API. The file and the password are not uploaded, and the password is not stored: if you lose it, the file cannot be recovered. An error shown on the page may be logged for us as cleaned text with the tool and browser names, never with the file, its name or the password."}
        faqs={[
          { q: "Is a wrong password detected?", a: "Yes, for files made by the current AES version: decryption is refused with a message saying the password is wrong or the file was changed or cut, and no file is offered. Those files start with a marker the tool recognizes." },
          { q: "Can I decrypt a file encrypted before 29 September 2026?", a: "Yes. A file without the AES marker is decrypted with the old XOR method, and a note warns that a wrong password cannot be detected there: if the result does not open, the password was wrong. Encrypt the file again to protect it with AES." },
          { q: "What if I forget the password?", a: "No recovery is possible. The key exists only while the page derives it from what you type; the site never receives the password, and there is no reset or back door. Keep the password somewhere safe before you delete the original file." },
          { q: "Does it work for large files?", a: "Yes, up to what the memory of your device holds: the tool sets no size limit, but the whole file and its encrypted copy are held in memory at the same time, so a very large file may fail on a phone." }
        ]}
        tips={[
          "Send the password through a different channel than the encrypted file, for example a call or another app."
        ]}
      />
    </div>
  );
}