'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); };

  const unlock = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('@cantoo/pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const decryptedDoc = await PDFDocument.load(arrayBuffer, { password });
      // Rebuild into a brand new document rather than re-saving decryptedDoc directly:
      // the source file's now-orphaned /Encrypt dictionary and old xref data can otherwise
      // get carried over as unreferenced objects, causing some readers to still flag the file as encrypted.
      const pdfDoc = await PDFDocument.create();
      const copiedPages = await pdfDoc.copyPages(decryptedDoc, decryptedDoc.getPageIndices());
      copiedPages.forEach(p => pdfDoc.addPage(p));
      const pdfBytes = await pdfDoc.save();
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a protected PDF</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Password (if required)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter PDF password" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <button onClick={unlock} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Unlocking...' : 'Unlock PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="unlocked.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Unlocked PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Unlock"
        description="PDF Unlock decrypts a password-protected PDF using the password you provide, via the @cantoo/pdf-lib library's standard PDF security handler entirely in your browser — your file is never uploaded to a server. It then re-saves the document without encryption, so the downloaded copy opens without a password."
        howTo={[
          "Click the upload area and select a password-protected PDF file.",
          "Type the PDF's password into the field.",
          "Click 'Unlock PDF' to decrypt it.",
          "Click 'Download Unlocked PDF' to save the password-free result."
        ]}
        faqs={[
          { q: "Is PDF Unlock free to use?", a: "Yes, it's free with no signup required." },
          { q: "Can this remove a real password from an encrypted PDF?", a: "Yes — given the correct password, it decrypts the document's standard PDF encryption and re-saves it without protection." },
          { q: "What if I enter the wrong password?", a: "Decryption fails and you'll see \"Could not unlock PDF. Wrong password?\" — double-check the password and try again." },
          { q: "Is my file uploaded to a server?", a: "No, decryption happens entirely in your browser using the pdf-lib library." }
        ]}
        tips={[
          "You need the PDF's actual password (user or owner) — this tool removes protection, it doesn't crack or guess unknown passwords.",
          "If the PDF isn't password-protected at all, you can leave the password field blank and it will still process normally.",
          "Download and reopen the result to confirm it no longer prompts for a password.",
          "Keep your original protected file as a backup until you've confirmed the unlocked version looks correct."
        ]}
      />
    </div>
  );
}