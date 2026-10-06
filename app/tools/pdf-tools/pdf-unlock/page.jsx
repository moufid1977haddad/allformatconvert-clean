'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { unlockPdfBytes } from '../../../lib/pdfUnlock';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function Page() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); };

  const unlock = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // The decrypted document itself is saved (bookmarks, form fields and metadata kept), see lib/pdfUnlock.js.
      const { bytes: pdfBytes, wasEncrypted } = await unlockPdfBytes(new Uint8Array(arrayBuffer), password);
      if (!wasEncrypted) {
        setError('This PDF is not protected: it opens without a password and has no restrictions, so there is nothing to remove.');
        setLoading(false);
        return;
      }
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) {
      const msg = e?.message || '';
      if (msg === 'NEEDS PASSWORD') {
        setError('This PDF is password-protected. Please enter the password.');
      } else if (msg === 'Password incorrect') {
        setError('Could not unlock PDF. Wrong password?');
      } else {
        setError('Could not unlock PDF: ' + (msg || 'the file may be corrupted or not a valid PDF.'));
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Unlock PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Remove password protection from PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a protected PDF" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Password (if required)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter PDF password" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <button onClick={unlock} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Unlocking...' : 'Unlock PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <FileDownload href={result} name="unlocked.pdf" />}
        </div>
      </div>
      <SeoContent
        title="PDF Unlock"
        description={`PDF Unlock decrypts a protected PDF with its password and saves the same document without encryption, so the copy opens without a password and without printing, copying or editing restrictions. Bookmarks, form fields and document information are kept. Either the open (user) password or the permissions (owner) password works, and a PDF that only has restrictions opens with the field left empty. It does not guess or crack an unknown password, and a PDF that is not protected is reported instead of being copied. The password check and the decryption both happen on your device.`}
        howToTitle="How to remove a password from a PDF"
        howTo={[
          `Choose the protected PDF.`,
          `Type its password in "Password (if required)", or leave the field empty if the file opens without one.`,
          `Click "Unlock PDF", then "Download" to save unlocked.pdf.`,
        ]}
        specs={[
          { label: 'Input', value: `Encrypted PDF` },
          { label: 'Password', value: `Open or permissions password; none for restrictions only` },
          { label: 'Kept', value: `Bookmarks, form fields, document information` },
          { label: 'Result', value: `unlocked.pdf, without encryption` },
        ]}
        privacy={`The password you type and the PDF are used only inside your browser, where @cantoo/pdf-lib decrypts the file; neither of them is ever sent to our servers. A PDF that only carries restrictions is opened with an empty password, so in that case you type nothing at all.`}
        faqs={[
          { q: "Can it unlock a PDF if I forgot the password?", a: `No. The tool needs the real password and never tries to guess one. If the file opens without a password and only blocks printing or copying, leave the field empty: those restrictions are removed without any password.` },
          { q: "Does Wrong password mean the password does not match?", a: `Yes. The password you typed does not open this file. Check upper and lower case and the keyboard layout. If you left the field empty and the PDF asks for a password to open, the message asks you to enter it instead.` },
          { q: "Do I get a file for a PDF that is not protected?", a: `No. Such a PDF opens without a password and has no restrictions, so there is nothing to remove. The page says so instead of giving you an identical copy.` },
          { q: "Are bookmarks and form fields kept?", a: `Yes. The decrypted document itself is saved, so bookmarks, form fields and document information stay; only the encryption and the objects that referred to it are removed.` },
        ]}
        tips={[
          `To protect the unlocked copy again with new permissions, use PDF Protect.`,
        ]}
      />
    </div>
  );
}