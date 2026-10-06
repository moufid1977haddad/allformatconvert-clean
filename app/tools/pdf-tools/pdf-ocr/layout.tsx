import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF OCR — Searchable PDF from Scans, 100+ Languages" },
  description: "Recognize the text of scanned or photographed PDF pages with Tesseract in up to three languages, then copy it or download a searchable PDF.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ocr" },
  openGraph: {
    title: "PDF OCR — Searchable PDF from Scans, 100+ Languages",
    description: "Recognize the text of scanned or photographed PDF pages with Tesseract in up to three languages, then copy it or download a searchable PDF.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ocr",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-ocr">{children}</ToolSeo>;
}
