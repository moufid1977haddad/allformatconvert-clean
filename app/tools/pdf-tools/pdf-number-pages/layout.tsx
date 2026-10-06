import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Add Page Numbers to PDF — Formats, Range, Margins" },
  description: "Number PDF pages as 1, 1 / 12, Page 1, Page 1 of 12 or your own text, choose where numbering starts and stops, skip a cover, then save the copy.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-number-pages" },
  openGraph: {
    title: "Add Page Numbers to PDF — Formats, Range, Margins",
    description: "Number PDF pages as 1, 1 / 12, Page 1, Page 1 of 12 or your own text, choose where numbering starts and stops, skip a cover, then save the copy.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-number-pages",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-number-pages">{children}</ToolSeo>;
}
