'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function PdfProtectPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [perm, setPerm] = useState({ printing: 'highResolution', copying: false, modifying: false, annotating: false, fillingForms: true, documentAssembly: false });
  const [error, setError] = useToolError('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDownloadUrl(null);
  };

  const protect = async () => {
    if (!file || !password) return;
    setLoading(true);
    setStatus('Processing...'); setError('');
    setDownloadUrl(null);
    try {
      if (ownerPassword && ownerPassword === password) throw new Error('The permissions password must be different from the open password, or anyone who can open the file could lift the restrictions.');
      const arrayBuffer = await file.arrayBuffer();
      const { PDFDocument, PDFHeader } = await import('@cantoo/pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
      // P24 (03/10): @cantoo/pdf-lib picks the cipher from the file's header version — a PDF 1.3 was encrypted with
      // RC4 40-bit (broken in minutes), 1.4-1.5 with RC4 128. The header is raised to 1.7 first: AES-128 for every file
      // (Smallpdf: AES 128-bit). Its AES-256 is revision 5, deprecated for a fast password check: not used.
      // the library recognises only '1.4' to '1.7' (and '1.7ext3'): anything else, a PDF 2.0 included, got RC4 40-bit
      if (!['1.6', '1.7'].includes(pdfDoc.context.header.getVersionString())) pdfDoc.context.header = PDFHeader.forVersion(1, 7);
      // The owner (permissions) password was "password + _owner": anyone who could open the file could lift every
      // restriction. Now the visitor's own, or 32 random characters nobody knows.
      const owner = ownerPassword || Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(36).padStart(2, '0')).join('');
      pdfDoc.encrypt({ userPassword: password, ownerPassword: owner, permissions: { ...perm, contentAccessibility: true } });
      const enc = pdfDoc.context.security && pdfDoc.context.security.encryption;
      if (!enc || enc.V !== 4) throw new Error('This PDF could not be encrypted with AES: nothing was saved. Please report this file to us.');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('Encrypted with AES-128.');
    } catch (err) {
      setStatus(''); setError(err?.message || 'The PDF could not be protected.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Protect PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Add a password to your PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter password" />
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-indigo-700">Permissions (what people who open the file may do)</summary>
            <div className="mt-3 space-y-2">
              <label className="block"><span className="block text-neutral-500 mb-1">Printing</span>
                <select id="pp-print" value={String(perm.printing)} onChange={e => setPerm({ ...perm, printing: e.target.value === 'false' ? false : e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                  <option value="highResolution">Allowed</option><option value="lowResolution">Low resolution only</option><option value="false">Not allowed</option>
                </select></label>
              {[['copying', 'Copy text and images'], ['modifying', 'Edit the content'], ['annotating', 'Add comments'], ['fillingForms', 'Fill in form fields'], ['documentAssembly', 'Insert, rotate or delete pages']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={!!perm[k]} onChange={e => setPerm({ ...perm, [k]: e.target.checked })} /> {l}</label>
              ))}
              <label className="block"><span className="block text-neutral-500 mb-1">Permissions password (optional — needed to change these permissions; leave empty for a random one nobody knows)</span>
                <input id="pp-owner" type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2" /></label>
            </div>
          </details>
          <button onClick={protect} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Protect PDF'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '-protected.pdf')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Protect"
        description={`PDF Protect encrypts your PDF with AES-128 so that it asks for the password you set before it opens. Under Permissions you decide what people who open it may do: print (normally, at low resolution only, or not at all), copy text and images, edit, add comments, fill in form fields, and insert, rotate or delete pages. Unless you change them, printing and form filling are allowed and the other four are blocked. A separate permissions password protects these settings; left empty, a random one nobody knows is used. The file is encrypted inside your browser before you download it.`}
        howToTitle="How to password-protect a PDF"
        howTo={[
          `Choose the PDF to protect.`,
          `Type the open password in "Password".`,
          `Open "Permissions (what people who open the file may do)" to change what is allowed and, if you wish, set a permissions password.`,
          `Click "Protect PDF", then "Download" to save the -protected.pdf file.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Encryption', value: `AES-128 for every file` },
          { label: 'Default permissions', value: `Printing and form filling allowed; copying, editing, comments and page changes blocked` },
          { label: 'Permissions password', value: `Yours or a random one; it must differ from the open password` },
          { label: 'Result', value: `Your file name followed by -protected.pdf` },
        ]}
        privacy={`The password and the PDF stay in your browser: @cantoo/pdf-lib encrypts the file locally and nothing about it is uploaded. The site keeps no copy of your password, so it cannot help you recover a forgotten one. When you leave the permissions password empty, its random replacement is also created in the browser, with the browser's cryptographic random generator.`}
        faqs={[
          { q: "How strong is the encryption?", a: `128-bit AES for every file. The file header is raised to PDF 1.7 first so older files do not fall back to the weak RC4 cipher, and the deprecated AES-256 revision 5 is not used. A long, unusual password matters more than the cipher.` },
          { q: "Can people copy text from my protected PDF?", a: `No, not by default: copying is blocked, like editing, comments and page changes. Open Permissions before you click Protect PDF and tick Copy text and images, or any other right you want to allow.` },
          { q: "Can someone remove the restrictions?", a: `Yes, anyone who knows the open password can. Permissions are rules that PDF readers follow, not a lock: tools such as our PDF Unlock remove them once the file can be opened. Only the open password keeps the content unreadable.` },
          { q: "Can I use the same password for opening and for permissions?", a: `No. The tool refuses it, because anyone who can open the file could then change the permissions. Leave the permissions password empty to get a random one that nobody knows.` },
        ]}
        tips={[
          `To remove the protection later, open the file in PDF Unlock with the same open password.`,
        ]}
      />
    </div>
  );
}