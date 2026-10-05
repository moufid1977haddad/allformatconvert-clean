import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to Word — Convert Your PDF to an Editable .docx Online Free" },
  description: "PDF to Word converts a PDF to an editable .docx, .doc (Word 97-2003) or .rtf. In our tests on Word-exported PDFs, headings, tables, columns and lists were kept; scanned PDFs are not supported.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-word" },
  openGraph: {
    title: "PDF to Word — Convert Your PDF to an Editable .docx Online Free",
    description: "PDF to Word converts a PDF to an editable .docx, .doc (Word 97-2003) or .rtf. In our tests on Word-exported PDFs, headings, tables, columns and lists were kept; scanned PDFs are not supported.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-word",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-to-word">{children}</ToolSeo>;
}
