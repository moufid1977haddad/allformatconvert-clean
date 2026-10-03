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
        description="PDF Protect encrypts your PDF with the password you enter, using the @cantoo/pdf-lib library's standard PDF security handler entirely in your browser — your file is never uploaded to a server. Every file is encrypted with AES-128. The password you enter is needed to open the file; under Permissions you choose whether people who open it may print, copy, edit, comment, fill in forms or rearrange pages, and you can set a separate permissions password (otherwise a random one nobody knows)."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type a password into the field.",
          "Click 'Protect PDF' to encrypt the file with that password.",
          "Click 'Download' to save the password-protected PDF."
        ]}
        faqs={[
          { q: "Is PDF Protect free to use?", a: "Yes, it's free with no signup required." },
          { q: "How secure is the encryption?", a: "AES-128, the PDF standard's AES cipher, for every file (older PDFs are no longer given the weak RC4 cipher). Anyone opening the file must enter the password you set; a long password matters more than anything else." },
          { q: "Will my file be uploaded to a server?", a: "No, encryption happens entirely in your browser." },
          { q: "Can I set separate owner and user passwords or custom permissions?", a: "Yes. Open 'Permissions' to allow or block printing, copying, editing, comments, form filling and page changes, and to set a permissions (owner) password. Without one, a random owner password is used, so nobody can lift the restrictions." }
        ]}
        tips={[
          "Remember your password — there's no recovery option, and losing it means losing access to the protected file.",
          "Use the PDF Unlock tool with the same password if you need to remove protection later.",
          "Since editing, copying, and printing restrictions are enforced via the PDF standard, a determined user with specialized software may still be able to bypass permission restrictions (though not the password itself) — don't treat this as airtight DRM.",
          "Test opening the downloaded file with your password in a PDF reader before sharing it, to confirm it was protected as expected."
        ]}
      />
    </div>
  );
}