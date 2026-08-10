'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, flatCategoryTextColors } from '../../lib/toolIcons';

const toolColor = flatCategoryTextColors['/tools/converter-tools'];

const tools = [
  { title: 'Currency Converter', description: 'Convert between world currencies', href: '/tools/converter-tools/currency-converter' },
  { title: 'Unit Converter', description: 'Convert length, weight, temperature', href: '/tools/converter-tools/unit-converter' },
  { title: 'Color Converter', description: 'Convert HEX, RGB, HSL colors', href: '/tools/converter-tools/color-converter' },
  { title: 'MOBI to EPUB', description: 'Convert MOBI ebooks to EPUB', href: '/tools/converter-tools/mobi-to-epub' },
];

export default function ConverterToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="converter-tools" className="w-8 h-8 text-yellow-500" /> Converter Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your converter tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolColor}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Converter Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Converter Tools is a free online utility that instantly converts between multiple file formats, units of measurement, and data types without requiring any software installation or registration. Simplify your workflow by converting images, documents, currencies, temperatures, and more with just a few clicks.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Converter Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Converter Tools website and select the conversion type you need from the main menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your file or enter the value you want to convert in the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your desired output format or unit from the dropdown options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Convert button and download or copy your converted result instantly</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Converter Tools really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Converter Tools is completely free with no hidden charges, subscription fees, or premium features required for basic conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Converter Tools support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Converter Tools supports a wide range of formats including PDF, JPG, PNG, MP4, DOCX, and many others for document and media conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using Converter Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all uploaded files are processed securely and automatically deleted from our servers after conversion is complete for your privacy protection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Converter Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account or registration is necessary to use Converter Tools, making it quick and convenient for immediate conversions.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark Converter Tools for quick access to frequently needed conversions without searching each time</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use batch conversion features when available to convert multiple files at once and save time</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the preview of your converted file before downloading to ensure the output meets your requirements</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Clear your browser cache periodically to maintain optimal performance when using the online converter</li>
          </ul>
        </div>
      </div>
    </div>
  );
}