import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "EPUB to PDF — Convert an Ebook to a Printable PDF Free" },
  description: "Convert an EPUB ebook without DRM to PDF. Your browser gathers the chapters, images and cover, and our Chromium service prints them as pages.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/epub-to-pdf" },
  openGraph: {
    title: "EPUB to PDF — Convert an Ebook to a Printable PDF Free",
    description: "Convert an EPUB ebook without DRM to PDF. Your browser gathers the chapters, images and cover, and our Chromium service prints them as pages.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/epub-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/epub-to-pdf">{children}</ToolSeo>;
}
