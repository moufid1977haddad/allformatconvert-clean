import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text to PDF — TXT to PDF with Emoji and World Scripts" },
  description: "Put plain text or a .txt file into a PDF with word wrap and page breaks. The PDF is made in your browser unless the text has emoji or a rarer script.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/text-to-pdf" },
  openGraph: {
    title: "Text to PDF — TXT to PDF with Emoji and World Scripts",
    description: "Put plain text or a .txt file into a PDF with word wrap and page breaks. The PDF is made in your browser unless the text has emoji or a rarer script.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/text-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/text-to-pdf">{children}</ToolSeo>;
}
