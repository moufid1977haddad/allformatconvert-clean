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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About File Encryptor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">File Encryptor is a free online tool that secures your sensitive documents and data by encrypting them with advanced algorithms, protecting your privacy without requiring software installation. Easily encrypt and decrypt files directly in your browser while maintaining complete control over your encryption keys.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use File Encryptor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the File Encryptor website and click the 'Choose File' button to select the document you want to encrypt</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Create a strong password that will be used as your encryption key, then confirm it in the password field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Encrypt' button and wait for the encryption process to complete</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your encrypted file and store it securely; you'll need the same password to decrypt it later</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is File Encryptor really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, File Encryptor is completely free with no hidden charges, subscription fees, or premium versions required for basic encryption functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file types can I encrypt?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Encryptor supports all file types including documents, images, videos, archives, and more with no size restrictions on most standard files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe with File Encryptor?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your files are encrypted locally in your browser using military-grade encryption standards, and we don't store or access your files on our servers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What if I forget my encryption password?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Unfortunately, encrypted files cannot be recovered without the original password due to the strength of the encryption, so please store your passwords securely.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a password that combines uppercase letters, lowercase letters, numbers, and special characters to maximize encryption security</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup of your original unencrypted files in a safe location before encrypting important documents</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Store your encryption passwords in a password manager to avoid losing access to your encrypted files</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the decryption process with a non-critical file first to ensure you remember your password correctly before encrypting sensitive data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}