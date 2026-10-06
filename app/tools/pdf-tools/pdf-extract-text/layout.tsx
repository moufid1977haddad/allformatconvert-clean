import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Extract Text from PDF — Copy It or Save as TXT" },
  description: "Pull the selectable text out of a PDF, for every page or chosen pages, then copy it or download a .txt file. Read locally with PDF.js, without OCR.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-extract-text" },
  openGraph: {
    title: "Extract Text from PDF — Copy It or Save as TXT",
    description: "Pull the selectable text out of a PDF, for every page or chosen pages, then copy it or download a .txt file. Read locally with PDF.js, without OCR.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-extract-text",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-extract-text">{children}</ToolSeo>;
}
