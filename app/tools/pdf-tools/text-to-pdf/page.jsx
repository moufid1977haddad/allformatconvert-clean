'use client';
import { useState, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export default function TextToPdfPage() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('paste');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    const content = await f.text();
    setText(content);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!text) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      const pageWidth = 595;
      const pageHeight = 842;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = fontSize * 1.5;
      const lines = [];
      text.split('\n').forEach(paragraph => {
        const words = paragraph.split(' ');
        let currentLine = '';
        words.forEach(word => {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        lines.push(currentLine);
      });
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;
      for (const line of lines) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
        y -= lineHeight;
      }
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
        <h1 className="text-3xl font-bold text-center mb-2">Text to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert plain text to a PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('paste'); setText(''); setFile(null); setDownloadUrl(null); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>Paste Text</button>
            <button onClick={() => { setMode('file'); setText(''); setFile(null); setDownloadUrl(null); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>Upload File</button>
          </div>
          {mode === 'paste' ? (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop a .txt file here'}</p>
              <input ref={inputRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
            </div>
          )}
          <button onClick={convert} disabled={!text || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download="document.pdf" className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download PDF</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text To Pdf</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text To PDF is a free online tool that instantly converts plain text content into professional PDF documents without requiring any software installation or registration. Whether you're converting notes, documents, or written content, this simple tool ensures your text is formatted and saved as a portable PDF file.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text To Pdf</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Copy or paste your text content into the input field on the Text To PDF tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Customize optional settings such as font size, margins, and document title if desired</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert to PDF' button to process your text instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your generated PDF file to your device or save it to cloud storage</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text To PDF completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text To PDF is 100% free with no hidden charges, registration requirements, or usage limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Text To PDF?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Text To PDF is a web-based tool that works directly in your browser without any downloads or installations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does Text To PDF have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Text To PDF can handle large documents, typically supporting text files up to several megabytes in size.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my text data secure when using Text To PDF?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your text is processed securely and is not stored on our servers after conversion is complete.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Format your text with line breaks and spacing before conversion to maintain better readability in the final PDF</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use descriptive document titles to help organize your converted PDFs in your file system</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust font size and margins based on your intended use to ensure optimal printing or digital viewing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert sensitive documents and immediately delete the original text to maintain privacy and security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}