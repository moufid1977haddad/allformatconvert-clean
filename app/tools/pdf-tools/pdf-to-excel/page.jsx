'use client';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">
          Back to PDF Tools
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">PDF to Excel</h1>
        <p className="text-neutral-500 mb-10">Convert PDF tables to Excel spreadsheet</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf To Excel</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF to Excel is a free online conversion tool that instantly transforms your PDF files into editable Excel spreadsheets without requiring any software installation. Our user-friendly platform preserves your data formatting and structure while making it easy to work with tables and data from PDF documents.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf To Excel</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF to Excel converter website and click the 'Choose File' or 'Upload PDF' button to select your PDF document from your computer.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the file to upload and the tool to automatically process your PDF, extracting all tables and data into Excel format.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted spreadsheet preview to ensure all your data has been properly transferred and formatted correctly.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your Excel file to your computer and open it in Microsoft Excel or any spreadsheet application.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF to Excel really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our PDF to Excel converter is completely free with no hidden charges, registration requirements, or software downloads needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does the tool have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool can handle PDF files up to 50MB in size, making it suitable for most standard business documents and spreadsheets.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my converted Excel file maintain the original formatting?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The converter preserves most formatting including cell borders, colors, and basic styling, though complex layouts may require minor adjustments.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my uploaded PDF file kept private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, we automatically delete all uploaded files after conversion is complete and never store your data on our servers for security and privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your PDF contains clearly defined tables with distinct rows and columns before conversion.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your PDF has multiple pages, the converter will process all pages and organize the data into separate sheets in your Excel file.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Double-check your converted Excel file for any merged cells or complex formatting that may need manual adjustment in your spreadsheet.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your original PDF file as a backup in case you need to re-convert or verify specific data after the conversion process.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}