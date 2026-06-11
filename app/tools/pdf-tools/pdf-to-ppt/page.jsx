'use client';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">
          Back to PDF Tools
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">PDF to PowerPoint</h1>
        <p className="text-neutral-500 mb-10">Convert PDF to editable PowerPoint presentation</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are working hard to bring you this tool. Stay tuned!</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf To Ppt</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF To PPT is a free online conversion tool that instantly transforms your PDF documents into editable PowerPoint presentations. Save time and effort by converting complex PDF files into professional slide formats without requiring any software installation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf To Ppt</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF To PPT website and click the 'Upload PDF' button to select your document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the tool to process and convert your PDF file into PowerPoint format automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview the converted presentation to ensure all content, images, and formatting have been properly transferred</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your new PPT file to your device and start editing</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF To PPT completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF To PPT is 100% free with no hidden charges, subscriptions, or premium features. You can convert unlimited files without paying anything.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does PDF To PPT have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF To PPT supports files up to 100MB in size, allowing you to convert most standard and large PDF documents without restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use PDF To PPT?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PDF To PPT is a web-based tool that works directly in your browser. No downloads or installations are required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my PDF data be secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all uploaded files are processed securely and automatically deleted after conversion. Your data privacy is our top priority.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your PDF has clear text and images before converting to maintain quality in your PowerPoint presentation</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review and edit the converted presentation immediately after downloading to adjust formatting, fonts, and layout to your preferences</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your PDF contains complex graphics or charts, you may need to manually optimize them in PowerPoint for better visual presentation</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use PDF To PPT for batch conversions by converting multiple files one at a time to quickly build a library of editable presentations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}