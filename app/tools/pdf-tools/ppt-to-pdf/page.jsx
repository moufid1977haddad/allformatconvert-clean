'use client';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">
          Back to PDF Tools
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">PowerPoint to PDF</h1>
        <p className="text-neutral-500 mb-10">Convert PPT/PPTX files to PDF</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Ppt To Pdf</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Ppt To Pdf is a free online converter that instantly transforms your PowerPoint presentations into professional PDF documents without any software installation or registration required. Our tool maintains all formatting, images, and layouts while providing a quick and secure conversion process.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Ppt To Pdf</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Click the upload button and select your PowerPoint (.ppt or .pptx) file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the file to be processed by our converter engine, which typically takes just a few seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted PDF preview to ensure all slides and formatting are correct</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your PDF file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Ppt To Pdf completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Ppt To Pdf is 100% free with no hidden charges, registration requirements, or download limits for all users.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Ppt To Pdf support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool supports all PowerPoint formats including .ppt, .pptx, and .odp files for conversion to PDF.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my uploaded file secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, all files are processed securely and automatically deleted from our servers within 24 hours to protect your privacy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple presentations at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can convert multiple PowerPoint files by uploading them one after another or using our batch conversion feature.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your PowerPoint file is properly formatted before conversion to maintain slide layouts and design elements</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your presentation contains embedded videos or audio, convert to PDF first and then add multimedia elements separately</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to check each slide before downloading to catch any formatting issues early</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress your PDF output by selecting the quality option to reduce file size while maintaining readability for sharing via email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}