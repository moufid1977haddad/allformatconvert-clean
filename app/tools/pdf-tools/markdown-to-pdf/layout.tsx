import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Markdown to PDF — Convert Markdown to a PDF File Online Free" },
  description: "Markdown to PDF online free: turn a .md file or pasted Markdown into a real PDF file with selectable text, tables, code blocks and clickable links.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/markdown-to-pdf" },
  openGraph: {
    title: "Markdown to PDF — Convert Markdown to a PDF File Online Free",
    description: "Markdown to PDF online free: turn a .md file or pasted Markdown into a real PDF file with selectable text, tables, code blocks and clickable links.",
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
