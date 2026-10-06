'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'ZIP Extractor', description: 'Open ZIP, RAR, 7Z, TAR and other archives', href: '/tools/file-tools/zip-extractor' },
  { title: 'ZIP Creator', description: 'Pack files into a ZIP, AES-256 password optional', href: '/tools/file-tools/zip-creator' },
  { title: 'TAR Extractor', description: 'Extract TAR, TAR.GZ and TGZ archives', href: '/tools/file-tools/tar-extractor' },
  { title: 'File Converter', description: 'Re-save a text file as TXT, JSON, CSV or HTML', href: '/tools/file-tools/file-converter' },
  { title: 'File Encryptor', description: 'Encrypt a file with a password (AES-256-GCM)', href: '/tools/file-tools/file-encryptor' },
  { title: 'File Metadata', description: 'Real format, size, dates and embedded properties', href: '/tools/file-tools/file-metadata' },
  { title: 'Base64 Encoder', description: 'Turn a file into Base64 or a data URL', href: '/tools/file-tools/base64-encoder' },
  { title: 'File Comparator', description: 'Check whether two files are byte-identical', href: '/tools/file-tools/file-comparator' },
  { title: 'File Splitter', description: 'Cut a file into numbered parts and join them back', href: '/tools/file-tools/file-splitter' },
];

export default function FileToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="file-tools" className={`w-8 h-8 ${categoryColors['file-tools']}`} /> File Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Archives, encryption and file inspection - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About File Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">All nine file tools work in your browser, so your files are not uploaded to our server. ZIP Extractor reads ZIP files with zip.js and RAR, 7Z, CAB and the other archive formats with a WebAssembly build of 7-Zip. File Encryptor and ZIP Creator protect files with AES-256 and a password you choose. The other tools inspect or reshape a file: its real format and embedded properties, a byte-by-byte comparison, numbered parts, Base64 text or a re-saved text format.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use File Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Pick the task: open an archive, build a ZIP, encrypt or decrypt, split or join, compare, or read what a file really is.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose the file: ZIP Creator accepts several, File Comparator exactly two, and the join mode of File Splitter the numbered parts.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Enter a password when the tool needs one: to lock or unlock in File Encryptor, for an encrypted ZIP, or for a protected archive in ZIP Extractor.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Save each file on its own, or all of them in one ZIP when the tool offers it.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which archive formats can I open?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">ZIP, RAR including RAR5, 7Z, TAR, GZ, CAB, LZH and the other formats 7-Zip reads, in ZIP Extractor, including password-protected and multi-part archives. TAR Extractor handles TAR, TAR.GZ and TGZ.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I recover a file if I forget the File Encryptor password?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. The key is derived from your password with PBKDF2-SHA-256 at 600,000 iterations and is never stored, so without the password the .encrypted file cannot be decrypted, by you or by us.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a size limit?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, for three tools. File Splitter takes files up to 5 GB. ZIP Creator takes 700 MB of files on a computer and 100 MB on phones, iPhone and iPad. ZIP Extractor extracts files of up to 1.9 GB each on a computer and 300 MB on phones, iPhone and iPad. The others read the whole file into memory, so your device sets the limit.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does File Converter convert Word or PDF files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. It re-saves text files (TXT, CSV, JSON, HTML, Markdown) as TXT, JSON, CSV or HTML. For documents, use the converters in PDF Tools, such as Word to PDF or PDF to Word.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Cut a file that is too large for an email attachment with File Splitter; the recipient joins the parts with the same tool.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>File Metadata reads a file's first bytes, so a renamed file shows the format it really has.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>File Comparator gives the position of the first byte that differs between two copies of a download.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>In Chrome and Edge, ZIP Extractor can write the extracted files straight into a folder you choose.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}