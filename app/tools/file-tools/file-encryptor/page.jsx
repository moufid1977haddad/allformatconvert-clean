'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { encryptBytes, decryptBytes } from '../../../lib/textCrypto';
import { FileDownload } from '../../../components/FileDownload';
export default function FileEncryptorPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [mode, setMode] = useState('encrypt');
  const [note, setNote] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setDownloadUrl(null); };
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
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter password..." /></div>
          <button onClick={process} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}</button>
          {note && <p className="text-amber-700 text-sm text-center">{note}</p>}
          {downloadUrl && <FileDownload href={downloadUrl} name={mode === 'encrypt' ? file.name + '.encrypted' : (file.name.endsWith('.encrypted') ? file.name.slice(0, -10) : file.name + '.decrypted')} />}
        </div>
      </div>
      <SeoContent
        title={"File Encryptor"}
        description={"File Encryptor encrypts any file with a password using AES-256-GCM, through your browser's built-in Web Crypto API — the file never leaves your device. The key is derived from your password with PBKDF2-SHA-256 and 600,000 iterations (OWASP's 2023 recommendation), with a fresh random salt and IV for every file. Decryption is authenticated: a wrong password or a modified file is refused with a clear message instead of producing a corrupted file. Files encrypted with the tool's previous XOR method can still be decrypted."}
        howTo={[
          "Choose Encrypt or Decrypt.",
          "Select the file.",
          "Enter the password.",
          "Click the button, then download the result (the original name is restored when decrypting a .encrypted file)."
        ]}
        faqs={[
          { q: "Is File Encryptor free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What kind of encryption does it use?", a: "AES-256 in GCM mode, the authenticated encryption standard used by browsers and messaging apps, with a key derived from your password by PBKDF2-SHA-256 (600,000 iterations)." },
          { q: "What happens with a wrong password?", a: "Decryption is refused with a message; you never get a silently corrupted file." },
          { q: "What happens if I forget my password?", a: "The file cannot be recovered — there is no back door." },
          { q: "Is my file uploaded?", a: "No — encryption and decryption run entirely in your browser." }
        ]}
        tips={[
          "Use a long, unique password and share it through a different channel than the file.",
          "The encrypted file is slightly larger than the original (48 bytes of salt, IV and authentication tag).",
          "Keep the .encrypted extension so you know which files need decrypting."
        ]}
      />
    </div>
  );
}