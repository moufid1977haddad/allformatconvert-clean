import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to Word Converter — Editable DOCX, DOC or RTF Free" },
  description: "Convert a PDF to an editable Word document in .docx, .doc (Word 97-2003) or .rtf format. ConvertAPI does the work; .doc is finished by our LibreOffice.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-word" },
  openGraph: {
    title: "PDF to Word Converter — Editable DOCX, DOC or RTF Free",
    description: "Convert a PDF to an editable Word document in .docx, .doc (Word 97-2003) or .rtf format. ConvertAPI does the work; .doc is finished by our LibreOffice.",
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
