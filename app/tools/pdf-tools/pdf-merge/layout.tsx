import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Merge PDF — Combine PDFs, Images and Office Files" },
  description: "Combine PDF files with photos and Word, Excel or PowerPoint documents into one PDF, in the order you set, with a bookmark added for each file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-merge" },
  openGraph: {
    title: "Merge PDF — Combine PDFs, Images and Office Files",
    description: "Combine PDF files with photos and Word, Excel or PowerPoint documents into one PDF, in the order you set, with a bookmark added for each file.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-merge",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-merge">{children}</ToolSeo>;
}
