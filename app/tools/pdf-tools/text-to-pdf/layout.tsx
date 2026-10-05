import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text to PDF — Convert Plain Text Online Free" },
  description: "Free Text to PDF: any language (Arabic, Hindi, Bengali, Chinese…) and emoji in colour, with selectable text, word-wrap and page breaks.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/text-to-pdf" },
  openGraph: {
    title: "Text to PDF — Convert Plain Text Online Free",
    description: "Free Text to PDF: any language (Arabic, Hindi, Bengali, Chinese…) and emoji in colour, with selectable text, word-wrap and page breaks.",
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
