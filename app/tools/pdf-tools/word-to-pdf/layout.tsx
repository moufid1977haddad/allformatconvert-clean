import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Word to PDF Converter — DOCX, DOC, ODT, RTF & WPD Free" },
  description: "Convert Word, OpenDocument, RTF or WordPerfect files to PDF. A .docx is converted by ConvertAPI, other formats by our own LibreOffice service.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/word-to-pdf" },
  openGraph: {
    title: "Word to PDF Converter — DOCX, DOC, ODT, RTF & WPD Free",
    description: "Convert Word, OpenDocument, RTF or WordPerfect files to PDF. A .docx is converted by ConvertAPI, other formats by our own LibreOffice service.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/word-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/word-to-pdf">{children}</ToolSeo>;
}
