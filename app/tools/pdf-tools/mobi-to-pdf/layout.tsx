import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "MOBI to PDF — Kindle MOBI, AZW & AZW3 Books to PDF Free" },
  description: "Turn a Kindle .mobi, .azw or .azw3 book without DRM into a PDF. The book is decoded in your browser, then printed as pages by our Chromium service.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/mobi-to-pdf" },
  openGraph: {
    title: "MOBI to PDF — Kindle MOBI, AZW & AZW3 Books to PDF Free",
    description: "Turn a Kindle .mobi, .azw or .azw3 book without DRM into a PDF. The book is decoded in your browser, then printed as pages by our Chromium service.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/mobi-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/mobi-to-pdf">{children}</ToolSeo>;
}
