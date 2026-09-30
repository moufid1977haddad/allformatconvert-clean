'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { encryptText, decryptText } from '../../../lib/textCrypto';
import { TextDownload } from '../../../components/FileDownload';

export default function TextEncryptorPage() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [copyError, setCopyError] = useState(false);
  const encrypt = async () => {
    try { setResult(await encryptText(text, key)); setNote(''); }
    catch (e) { setResult(''); setNote(e.message); }
  };
  const decrypt = async () => {
    try {
      const r = await decryptText(text, key);
      setResult(r.text);
      setNote(r.legacy ? 'Decrypted from the old XOR format this tool used before 29 September 2026. That format is weak: encrypt the text again to protect it with AES-256.' : '');
    } catch (e) { setResult(''); setNote(e.message); }
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
            <button onClick={encrypt} disabled={!text || !key} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encrypt</button>
            <button onClick={decrypt} disabled={!text || !key} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decrypt</button>
          </div>
          {note && <p className="text-amber-700 text-sm text-center">{note}</p>}
          {result && (
            <div className="space-y-2">
              <textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <TextDownload text={result} name="encrypted.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Text Encryptor"}
        description={"Text Encryptor encrypts text with a password using AES-256-GCM, the standard used by browsers, banks and messaging apps, through your browser's built-in Web Crypto API — nothing is uploaded. The key is derived from your password with PBKDF2-SHA-256 and 600,000 iterations (OWASP's 2023 recommendation), with a fresh random salt and IV for every message, so the same text encrypts differently each time. Decryption is authenticated: a wrong password or an altered text is refused, never turned into garbage. The result is Base64 text you can paste anywhere."}
        howTo={[
          "Paste the text to encrypt, or the encrypted Base64 to decrypt.",
          "Enter the password.",
          "Click 'Encrypt' or 'Decrypt'.",
          "Copy the result."
        ]}
        faqs={[
          { q: "Is Text Encryptor free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How strong is the encryption?", a: "AES-256-GCM with a PBKDF2-SHA-256 key (600,000 iterations). Security then depends on your password: use a long, unique one." },
          { q: "What if I forget the password?", a: "The text cannot be recovered — there is no back door." },
          { q: "Why is the output different each time I encrypt the same text?", a: "A random salt and IV are generated for each message, as they should be; any of the outputs decrypts with the same password." },
          { q: "Can I still decrypt texts made with the previous version?", a: "Yes — texts encrypted with the old XOR method before 29 September 2026 still decrypt, with a notice recommending to encrypt them again." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Share the password through a different channel than the encrypted text.",
          "The encrypted text includes everything needed to decrypt it except the password."
        ]}
      />
    </div>
  );
}