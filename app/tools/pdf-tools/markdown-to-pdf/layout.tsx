import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Markdown to PDF — .md Files with Tables and Code to PDF" },
  description: "Turn a .md file or pasted Markdown into a PDF with GitHub tables, task lists and code blocks. A4 by default, or Letter, Legal, A3 or A5.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/markdown-to-pdf" },
  openGraph: {
    title: "Markdown to PDF — .md Files with Tables and Code to PDF",
    description: "Turn a .md file or pasted Markdown into a PDF with GitHub tables, task lists and code blocks. A4 by default, or Letter, Legal, A3 or A5.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/markdown-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/markdown-to-pdf">{children}</ToolSeo>;
}
