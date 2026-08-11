'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextEncryptorPage() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);

  const encrypt = () => {
    try {
      const bytes = new TextEncoder().encode(text);
      const keyBytes = new TextEncoder().encode(key);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] ^ keyBytes[i % keyBytes.length]);
      }
      setResult(btoa(binary));
    } catch(e) {
      setResult('Encryption failed: ' + e.message);
    }
  };

  const decrypt = () => {
    try {
      const binary = atob(text);
      const keyBytes = new TextEncoder().encode(key);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
      }
      setResult(new TextDecoder().decode(bytes));
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
            <button onClick={encrypt} disabled={!text || !key} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Encrypt</button>
            <button onClick={decrypt} disabled={!text || !key} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Decrypt</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text Encryptor"
        description="Text Encryptor obfuscates text with a password-based XOR cipher and Base64 encoding, entirely in your browser. It's a quick way to make text unreadable to a casual viewer without the password, though it is not a substitute for strong encryption standards like AES when protecting truly sensitive information."
        howTo={[
          "Enter or paste the text you want to encrypt.",
          "Type a secret key — this becomes your password, so remember it exactly.",
          "Click \"Encrypt\" to scramble the text, or \"Decrypt\" to reverse a previously encrypted message with the same key.",
          "Copy the result from the output field."
        ]}
        faqs={[
          { q: "Is Text Encryptor completely free to use?", a: "Yes, it's 100% free with no signup and no limits on how much text you can process." },
          { q: "How secure is this encryption?", a: "It uses a password-based XOR cipher followed by Base64 encoding — not AES or any \"military-grade\" standard. It's a fast way to obfuscate text so it isn't readable at a glance, but it shouldn't be relied on to protect highly sensitive or confidential information." },
          { q: "What if I forget my key?", a: "The text can't be recovered without the exact original key — there's no password recovery option." },
          { q: "Is my data uploaded anywhere?", a: "No, encryption and decryption both happen entirely in your browser — your text and key are never sent to a server." }
        ]}
        tips={[
          "Use a key you'll remember exactly — even one character off will produce garbled, unrecoverable output when decrypting.",
          "This tool suits casual privacy (keeping a note unreadable at a glance), not protecting data against a determined attacker.",
          "Always keep a copy of your original text, since there's no way to verify the key before you've already encrypted or decrypted.",
          "AES and Caesar Cipher options aren't available — the encrypt/decrypt buttons both use the same XOR + Base64 method regardless of what you type."
        ]}
      />
    </div>
  );
}