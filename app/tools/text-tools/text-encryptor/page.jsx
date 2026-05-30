'use client';
import { useState } from 'react';

export default function TextEncryptorPage() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');

  const encrypt = () => {
    const encrypted = text.split('').map((char, i) => {
      return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
    setResult(btoa(encrypted));
  };

  const decrypt = () => {
    try {
      const decoded = atob(text);
      const decrypted = decoded.split('').map((char, i) => {
        return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
      }).join('');
      setResult(decrypted);
    } catch(e) {
      setResult('Invalid encrypted text');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Encryptor</h1>
        <p className="text-neutral-500 text-center mb-8">Encrypt and decrypt text with a key</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Secret Key</label>
            <input type="password" value={key} onChange={e => setKey(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter secret key..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encrypt} disabled={!text || !key} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encrypt</button>
            <button onClick={decrypt} disabled={!text || !key} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decrypt</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}