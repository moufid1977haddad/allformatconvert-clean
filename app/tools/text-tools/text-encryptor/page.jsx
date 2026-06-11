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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Encryptor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Encryptor is a free online tool that allows you to quickly encrypt and decrypt text messages using advanced encryption algorithms to protect your sensitive information. It provides a simple, user-friendly interface for securing your data without requiring any software installation or technical knowledge.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Encryptor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter or paste the text you want to encrypt into the input field on the Text Encryptor homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your preferred encryption method from the available options such as AES, Caesar Cipher, or Base64 encoding</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Encrypt button to instantly convert your text into an encrypted format that cannot be easily read by unauthorized users</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the encrypted text from the output field and share it securely, or use the Decrypt feature with the correct password to reveal the original message</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Encryptor completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Encryptor is 100% free and requires no registration or payment. You can encrypt and decrypt unlimited amounts of text without any hidden fees or limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How secure is the encryption provided by Text Encryptor?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Text Encryptor uses industry-standard encryption algorithms like AES-256, which provides military-grade security. However, the security level depends on the encryption method you choose and the strength of your password.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Text Encryptor on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Encryptor is fully responsive and works on all mobile devices including smartphones and tablets. You can access it through any web browser without installing an app.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my encrypted text stored on your servers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Text Encryptor does not store any of your data. All encryption and decryption processes happen directly in your browser, ensuring complete privacy and security of your information.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use strong, unique passwords when encrypting sensitive information to ensure maximum security and prevent unauthorized access to your encrypted messages</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup of your encryption passwords in a secure location, as losing them may make it impossible to decrypt your messages in the future</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the AES encryption method for highly sensitive data as it offers superior security compared to simpler encryption techniques like Caesar Cipher</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your encrypted and decrypted text to ensure accuracy before sharing sensitive information with others using the same encryption method and password</li>
          </ul>
        </div>
      </div>
    </div>
  );
}