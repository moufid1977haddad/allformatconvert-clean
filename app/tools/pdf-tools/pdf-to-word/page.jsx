'use client';
import { useState, useRef } from 'react';

export default function PdfToWordPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const paragraphs = fullText.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
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
        <h1 className="text-3xl font-bold text-center mb-2">PDF to Word</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF to a .docx Word document</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to Word'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.pdf', '.docx')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download .docx</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf To Word</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF to Word is a free online conversion tool that transforms your PDF documents into editable Microsoft Word files in seconds. Simply upload your PDF, and our advanced converter will preserve formatting, images, and text layout while creating a fully editable DOCX file.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf To Word</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF to Word converter website and click the 'Upload PDF' button to select your file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the file to be processed automatically - our tool converts your PDF in the cloud within seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted document preview to ensure all content and formatting has been properly transferred</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your new Word document to your device and start editing</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF to Word really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our PDF to Word converter is completely free with no hidden charges, registration requirements, or premium upsells. Convert unlimited PDFs without paying anything.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does the converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool converts PDF files to Microsoft Word format (DOCX and DOC). It supports single and multi-page PDFs with images, tables, and complex formatting.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my PDF file be kept private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, we take security seriously. All uploaded files are processed securely and automatically deleted from our servers after conversion is complete. We do not store or share your documents.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert scanned PDFs or image-based PDFs?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our standard converter works best with text-based PDFs. For scanned documents, we recommend using OCR-enabled conversion tools for optimal text recognition.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your PDF file is under 50MB and contains clearly visible text and formatting that you want to preserve in Word</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Before converting important documents, test the converter with a sample page to verify that formatting, fonts, and layout meet your expectations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>After downloading your Word document, review and manually adjust any complex layouts, tables, or graphics that may need fine-tuning</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup copy of your original PDF file in case you need to reference the source document or reconvert with different settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}