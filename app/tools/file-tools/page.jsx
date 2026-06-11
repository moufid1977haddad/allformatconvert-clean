'use client';
import Link from 'next/link';

const tools = [
  { icon: '📦', title: 'ZIP Extractor', description: 'Extract ZIP archive files', href: '/tools/file-tools/zip-extractor' },
  { icon: '🗜️', title: 'ZIP Creator', description: 'Create ZIP archive files', href: '/tools/file-tools/zip-creator' },
  { icon: '📂', title: 'TAR Extractor', description: 'Extract TAR archive files', href: '/tools/file-tools/tar-extractor' },
  { icon: '🔄', title: 'File Converter', description: 'Convert files to different formats', href: '/tools/file-tools/file-converter' },
  { icon: '🔐', title: 'File Encryptor', description: 'Encrypt and decrypt files', href: '/tools/file-tools/file-encryptor' },
  { icon: '📊', title: 'File Metadata', description: 'View file metadata and info', href: '/tools/file-tools/file-metadata' },
  { icon: '🧮', title: 'Base64 Encoder', description: 'Encode and decode Base64', href: '/tools/file-tools/base64-encoder' },
  { icon: '🔍', title: 'File Comparator', description: 'Compare two files side by side', href: '/tools/file-tools/file-comparator' },
  { icon: '✂️', title: 'File Splitter', description: 'Split large files into parts', href: '/tools/file-tools/file-splitter' },
];

export default function FileToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">📁 File Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your file tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About File Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">File Tools is a comprehensive free online platform that enables users to convert, compress, and manage various file formats without requiring any software installation or registration. This versatile utility supports multiple file types including documents, images, videos, and archives, making it an essential resource for both personal and professional file management needs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use File Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the File Tools website and select the specific tool you need from the main menu or homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your file by clicking the upload button or dragging and dropping it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Configure any desired settings or conversion parameters if applicable to your selected tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the process button and download your converted or modified file once the operation completes</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is File Tools really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, File Tools is completely free with no hidden charges, registration requirements, or premium subscriptions needed to access all basic features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does File Tools support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">File Tools supports a wide range of formats including PDF, Word documents, Excel spreadsheets, images (JPG, PNG, GIF), videos, audio files, and compressed archives.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are my uploaded files secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your files are processed securely and are automatically deleted from our servers after conversion, ensuring complete privacy and data protection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use File Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, File Tools is entirely web-based and requires no software installation, making it accessible from any device with an internet connection and web browser.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch upload multiple files at once to save time when converting or processing similar file types in bulk operations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the file size limits before uploading large files; compress heavy documents first for faster processing speeds</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature when available to verify your conversion settings before finalizing to ensure desired output quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark File Tools in your browser for quick access and create keyboard shortcuts for your most frequently used conversion tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
}