'use client';
import { useState } from 'react';
export default function HashGeneratorPage() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState(null);
  const generate = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = async (algo) => { const buf = await crypto.subtle.digest(algo, data); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''); };
    const [sha1, sha256, sha512] = await Promise.all([hashBuffer('SHA-1'), hashBuffer('SHA-256'), hashBuffer('SHA-512')]);
    setHashes({ sha1, sha256, sha512 });
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hash Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate SHA-1, SHA-256, SHA-512 hashes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Enter text to hash..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={generate} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Generate Hashes</button>
          {hashes && ['sha1','sha256','sha512'].map(k => (
            <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
              <div className="text-neutral-500 text-xs mb-1 uppercase">{k}</div>
              <div className="font-mono text-xs break-all text-indigo-400">{hashes[k]}</div>
              <button onClick={() => navigator.clipboard.writeText(hashes[k])} className="text-xs text-neutral-500 hover:text-neutral-300 mt-1">Copy</button>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Hash Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Hash Generator is a free online tool that instantly converts any text or file into secure hash values using popular algorithms like MD5, SHA-1, SHA-256, and SHA-512. Perfect for developers, security professionals, and anyone needing to generate cryptographic hashes for passwords, checksums, or data verification.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Hash Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Hash Generator tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter your text or upload a file in the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select your preferred hashing algorithm from the dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Generate button to instantly receive your hash output</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a hash and why do I need it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A hash is a unique digital fingerprint of data created by a mathematical algorithm. Hashes are essential for password storage, file integrity verification, and ensuring data hasn't been tampered with during transmission.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which hashing algorithms does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our Hash Generator supports multiple algorithms including MD5, SHA-1, SHA-256, SHA-384, SHA-512, and other popular cryptographic hash functions used across the web.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this free tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Hash Generator processes all data locally in your browser without sending information to any server, ensuring complete privacy and security of your input data.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I generate hashes for large files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool can process both text input and file uploads of various sizes, making it ideal for verifying file integrity and checksums for downloads.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use SHA-256 or SHA-512 for password hashing as MD5 is considered cryptographically weak for security purposes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare generated hashes with source hashes to verify file integrity and detect any corruption or unauthorized modifications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Generate hashes for backup verification to ensure your backup files haven't been altered or damaged during storage</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use this tool to create unique identifiers for data tracking, logging, and database indexing without storing sensitive information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}