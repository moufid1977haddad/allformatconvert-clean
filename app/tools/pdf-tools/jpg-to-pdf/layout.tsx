import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JPG to PDF Converter — Photos to One PDF, A4 or Letter" },
  description: "Turn JPG photos, including iPhone HEIC shots, into one PDF without recompressing the JPEGs. Choose A4, Letter or one page per photo; no upload.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/jpg-to-pdf" },
  openGraph: {
    title: "JPG to PDF Converter — Photos to One PDF, A4 or Letter",
    description: "Turn JPG photos, including iPhone HEIC shots, into one PDF without recompressing the JPEGs. Choose A4, Letter or one page per photo; no upload.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/jpg-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/jpg-to-pdf">{children}</ToolSeo>;
}
