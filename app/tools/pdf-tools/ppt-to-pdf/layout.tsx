import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PowerPoint to PDF — PPTX, PPT, PPS & ODP Slides Free" },
  description: "Convert a PowerPoint deck, slide show or OpenDocument presentation to PDF with LibreOffice on our server. Segoe UI text is set in Selawik.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/ppt-to-pdf" },
  openGraph: {
    title: "PowerPoint to PDF — PPTX, PPT, PPS & ODP Slides Free",
    description: "Convert a PowerPoint deck, slide show or OpenDocument presentation to PDF with LibreOffice on our server. Segoe UI text is set in Selawik.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/ppt-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/ppt-to-pdf">{children}</ToolSeo>;
}
