'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function FileEncryptorPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [mode, setMode] = useState('encrypt');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setDownloadUrl(null); };
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
            <button onClick={() => setMode('encrypt')} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'encrypt' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100'}`}>Encrypt</button>
            <button onClick={() => setMode('decrypt')} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'decrypt' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100'}`}>Decrypt</button>
          </div>
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter password..." /></div>
          <button onClick={process} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}</button>
          {downloadUrl && <a href={downloadUrl} download={file.name + (mode === 'encrypt' ? '.encrypted' : '.decrypted')} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>}
        </div>
      </div>
      <SeoContent
        title="File Encryptor"
        description="File Encryptor is a free online tool that obfuscates any file with a password-based XOR cipher, entirely in your browser — no upload, no software installation. It's a quick way to make a file unreadable to a casual viewer without the password, though it is not a substitute for strong encryption standards like AES when protecting highly sensitive data."
        howTo={[
          "Choose \"Encrypt\" or \"Decrypt\" mode — the underlying operation is the same XOR process either way.",
          "Click the upload area and select the file you want to process.",
          "Enter a password — this becomes your key, so make sure you remember it exactly.",
          "Click the button to process the file, then download the result."
        ]}
        faqs={[
          { q: "Is File Encryptor free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "What kind of encryption does it use?", a: "A password-based XOR cipher applied to every byte of the file. It's a fast way to obfuscate a file so it isn't readable without the password, but it is not equivalent to strong standards like AES and shouldn't be relied on to protect highly sensitive or confidential data." },
          { q: "What file types can I process?", a: "Any file type — there are no format restrictions since the cipher works on raw bytes." },
          { q: "What happens if I forget my password?", a: "The file can't be restored without the exact original password — XOR decoding requires the identical key, and there's no recovery option." }
        ]}
        tips={[
          "Because XOR is symmetric, running the same password through \"Decrypt\" simply reverses whatever \"Encrypt\" did — the two modes only change the button label and the downloaded file's name.",
          "Use a password you'll remember exactly — even one character off will produce garbled, unrecoverable output.",
          "This tool suits casual privacy (keeping a file unreadable at a glance), not protecting data against a determined attacker.",
          "Always keep a backup of your original file — there's no way to verify the password before downloading, so mistakes can't be undone afterward."
        ]}
      />
    </div>
  );
}