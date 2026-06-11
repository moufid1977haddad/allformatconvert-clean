'use client';
import { useState, useRef } from 'react';
export default function FileEncryptorPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [mode, setMode] = useState('encrypt');
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setDownloadUrl(null); };
  const process = async () => {
    if (!file || !password) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const keyBytes = new TextEncoder().encode(password);
      const processed = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
      const blob = new Blob([processed]);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Encryptor</h1>
        <p className="text-neutral-500 text-center mb-8">Encrypt and decrypt files with a password</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode('encrypt')} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'encrypt' ? 'bg-indigo-600' : 'bg-neutral-800'}`}>Encrypt</button>
            <button onClick={() => setMode('decrypt')} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'decrypt' ? 'bg-indigo-600' : 'bg-neutral-800'}`}>Decrypt</button>
          </div>
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter password..." /></div>
          <button onClick={process} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}</button>
          {downloadUrl && <a href={downloadUrl} download={file.name + (mode === 'encrypt' ? '.encrypted' : '.decrypted')} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>}
        </div>
      </div>
    </div>
  );
}