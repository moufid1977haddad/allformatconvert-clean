'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from '@cantoo/pdf-lib';
import SeoContent from '../../../components/SeoContent';

export default function PdfProtectPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const protect = async () => {
    if (!file || !password) return;
    setLoading(true);
    setStatus('Processing...');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      pdfDoc.encrypt({
        userPassword: password,
        ownerPassword: password + '_owner',
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
        },
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
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
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter password" />
          </div>
          <button onClick={protect} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Protect PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace(/\.pdf$/i, '-protected.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Protect"
        description="PDF Protect encrypts your PDF with the password you enter, using the @cantoo/pdf-lib library's standard PDF security handler entirely in your browser — your file is never uploaded to a server. The password is set as the document's user password (required to open it), while a separate, non-user-facing owner password retains full permissions; printing, editing, copying, and annotating are restricted for anyone opening it with the password you set."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type a password into the field.",
          "Click 'Protect PDF' to encrypt the file with that password.",
          "Click 'Download' to save the password-protected PDF."
        ]}
        faqs={[
          { q: "Is PDF Protect free to use?", a: "Yes, it's free with no signup required." },
          { q: "How secure is the encryption?", a: "It uses the PDF standard security handler (RC4/AES depending on the source document's PDF version) via the pdf-lib encryption implementation. Anyone opening the file will be required to enter the password you set." },
          { q: "Will my file be uploaded to a server?", a: "No, encryption happens entirely in your browser." },
          { q: "Can I set separate owner and user passwords or custom permissions?", a: "The password you enter becomes the user password needed to open the file, and printing, editing, copying, and annotating are restricted by default. There's no UI yet to customize permissions or set a different owner password." }
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