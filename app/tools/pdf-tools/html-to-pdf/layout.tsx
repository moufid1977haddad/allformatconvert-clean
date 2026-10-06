import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "HTML to PDF Converter — From a URL, a File or Pasted Code" },
  description: "Print a public web page, an .html file or pasted HTML to PDF with Chromium on our server. Choose screen width, paper size, margins or one long page.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/html-to-pdf" },
  openGraph: {
    title: "HTML to PDF Converter — From a URL, a File or Pasted Code",
    description: "Print a public web page, an .html file or pasted HTML to PDF with Chromium on our server. Choose screen width, paper size, margins or one long page.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/html-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/html-to-pdf">{children}</ToolSeo>;
}
