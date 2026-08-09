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
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">PDF Editor</h1>
        <p className="text-neutral-500 mb-10">Edit text and images in your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ToolIcon slug="pdf-editor" className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are working hard to bring you this tool. Stay tuned!</p>
        </div>
      </div>
      <SeoContent
        title="PDF Editor"
        description="A full PDF Editor for adding text, images, and annotations directly onto a document is not yet available — this feature is under development. In the meantime, other tools on this site cover specific PDF edits: Watermark, Number Pages, Sign, Crop, Rotate, and Delete Pages."
      />
    </div>
  );
}