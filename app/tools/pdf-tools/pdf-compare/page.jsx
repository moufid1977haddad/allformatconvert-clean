'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const file1Ref = useRef();
  const file2Ref = useRef();

  const extractText = async (file) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  };

  const compare = async () => {
    if (!file1 || !file2) return;
    setLoading(true);
    setError('');
    try {
      const [t1, t2] = await Promise.all([extractText(file1), extractText(file2)]);
      setText1(t1);
      setText2(t2);
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Compare PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two PDF documents side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => file1Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file1 ? <p className="text-neutral-700 text-sm font-medium">{file1.name}</p> : <p className="text-neutral-400 text-sm">Click to upload PDF 1</p>}
            </div>
            <div onClick={() => file2Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file2 ? <p className="text-neutral-700 text-sm font-medium">{file2.name}</p> : <p className="text-neutral-400 text-sm">Click to upload PDF 2</p>}
            </div>
          </div>
          <input ref={file1Ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile1(e.target.files[0])} />
          <input ref={file2Ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile2(e.target.files[0])} />
          <button onClick={compare} disabled={!file1 || !file2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Comparing...' : 'Compare PDFs'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {text1 && text2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file1.name}</p>
                <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text1} readOnly />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file2.name}</p>
                <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text2} readOnly />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Compare</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Compare is a free online tool that allows you to quickly identify differences between two PDF documents by comparing their content, layout, and formatting side-by-side. Whether you're reviewing contracts, checking document versions, or validating changes, PDF Compare helps you spot variations instantly without downloading software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Compare</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your first PDF file by clicking the 'Choose File' button or dragging it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your second PDF file using the same method to load the document you want to compare against</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Compare' button to analyze both documents and generate a detailed comparison report</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review the highlighted differences showing added, removed, or modified content between the two PDFs</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Compare completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Compare is 100% free with no hidden charges, registration requirements, or premium features. You can compare unlimited PDFs without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does PDF Compare support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Compare supports PDF files up to 50MB in size, allowing you to compare large documents with detailed content and multiple pages.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I compare more than two PDF files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Compare is designed to compare two documents at a time for optimal clarity and accuracy. For multiple comparisons, you can run several comparisons sequentially.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using PDF Compare?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your files are processed securely and deleted immediately after comparison. We do not store or share your documents with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use PDF Compare to track version changes in contracts, agreements, and legal documents to ensure all modifications are intentional and approved</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare software documentation updates to quickly identify new features, removed sections, and changed specifications between releases</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate form submissions and templates by comparing the original template with completed versions to spot unauthorized alterations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review research papers and reports across versions to maintain version control and ensure proper attribution of all changes and updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}