'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { encryptText, decryptText } from '../../../lib/textCrypto';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TextEncryptorPage() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [copyError, setCopyError] = useState(false);
  const encrypt = async () => {
    try { setResult(await encryptText(text, key)); setNote(''); }
    catch (e) { reportShownMessage(e); setResult(''); setNote(e.message); }
  };
  const decrypt = async () => {
    try {
      const r = await decryptText(text, key);
      setResult(r.text);
      setNote(r.legacy ? 'Decrypted from the old XOR format this tool used before 29 September 2026. That format is weak: encrypt the text again to protect it with AES-256.' : '');
    } catch (e) { reportShownMessage(e); setResult(''); setNote(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Encryptor</h1>
        <p className="text-neutral-500 text-center mb-8">Encrypt and decrypt text with a key</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
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
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <TextDownload text={result} name="encrypted.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Text Encryptor"}
        description={"Text Encryptor turns a message into Base64 ciphertext that only someone with the password can read, and turns it back. It uses AES-256-GCM through your browser's Web Crypto API, with a key derived from the password by PBKDF2-SHA-256 over 600,000 iterations and a new random salt and IV for each message, so the same text never encrypts the same way twice. Use it for notes or messages sent through a channel you do not fully trust, with the password shared another way. It encrypts text only; File Encryptor handles files."}
        example={{
          caption: "Encrypted with the password blue-harbor-42. Your own result will differ, but this one decrypts back to the message with that password.",
          inputLabel: "Text (Secret Key: blue-harbor-42)",
          input: "Meet at 6",
          outputLabel: "Result after \"Encrypt\"",
          output: "T0NUMa1WBvLr2YnFybvyCCO1NYbVK+A6yHrUtZy1FHedD2vbLXuiD+a6YGuKU6QOoP+BnTHvrSVS",
        }}
        howToTitle={"How to encrypt and decrypt text with a password"}
        howTo={[
          "Paste the message to encrypt, or the Base64 text to decrypt, into the box.",
          "Type a long passphrase in \"Secret Key\"; the field hides what you type.",
          "Click \"Encrypt\" or \"Decrypt\"; both stay inactive until the box and the key are filled.",
          "Click \"Copy\", or \"Download\" to save the result as encrypted.txt, a name kept even after decrypting."
        ]}
        specs={[
          { label: "Algorithm", value: "PBKDF2-SHA-256 turns the password into a key over 600,000 iterations, then AES-256-GCM encrypts the message" },
          { label: "Per message", value: "A random 16-byte salt and a random 12-byte IV" },
          { label: "Encrypted text", value: "Base64 of the marker OCT1, the salt, the IV, the ciphertext and its tag, so it always starts with T0NU" },
          { label: "Old format", value: "Texts encrypted with the XOR method used before 29 September 2026 still decrypt, with a warning" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Your browser's Web Crypto API does both the encrypting and the decrypting on this page. The message, the password and the result are never sent to us, so no copy exists that could be recovered. Error messages shown here, such as a wrong-password warning, are reported to our error log with the tool name and your browser name and version, without your text or password."}
        faqs={[
          { q: "Is the encryption safe with a short password?", a: "No. AES-256-GCM is not the weak point: a short or common password can still be guessed by trying many candidates, and the 600,000 PBKDF2 iterations only slow each guess down. Use a long passphrase that you do not use anywhere else." },
          { q: "Will a wrong password give me garbled text?", a: "No, for texts encrypted since 29 September 2026: AES-GCM checks integrity, so a wrong password or a changed text is refused with an error. Base64 in the old XOR format, or any Base64 not made by this tool, cannot be checked, so a wrong password there may show unreadable text with the old-format warning." },
          { q: "Can you recover my text if I forget the password?", a: "No. We never receive the password or the text. The encrypted text holds everything needed to decrypt it except the password, so without it nobody can read the message." },
          { q: "Is it normal that the same text encrypts differently each time?", a: "Yes. A new random salt and IV are drawn for every message, so two results never match, which also hides that two messages are identical. Any of those results decrypts with the same password." }
        ]}
        tips={[
          "Send the password through a different channel than the encrypted text, for example by phone."
        ]}
      />
    </div>
  );
}