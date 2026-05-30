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
    </div>
  );
}
