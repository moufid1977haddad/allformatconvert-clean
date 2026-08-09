'use client';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { ToolIcon } from '../../../lib/toolIcons';

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
            <ToolIcon slug="pdf-to-excel" className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are working hard to bring you this tool. Stay tuned!</p>
        </div>
      </div>
      <SeoContent
        title="PDF to Excel"
        description="A tool to extract tables from a PDF into an editable Excel spreadsheet is not yet available — this feature is under development. Check back soon, or explore our other PDF tools in the meantime."
      />
    </div>
  );
}