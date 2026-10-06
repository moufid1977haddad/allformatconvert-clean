import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Compare Two PDFs — Line-by-Line Text Differences" },
  description: "Find what changed between two versions of a PDF: lines only in one file in red or green, changed words marked, page numbers shown. Read locally by PDF.js.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compare" },
  openGraph: {
    title: "Compare Two PDFs — Line-by-Line Text Differences",
    description: "Find what changed between two versions of a PDF: lines only in one file in red or green, changed words marked, page numbers shown. Read locally by PDF.js.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compare",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-compare">{children}</ToolSeo>;
}
