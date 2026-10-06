import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to PDF/A Converter — 1b to 3a, Checked by veraPDF" },
  description: "Convert a PDF to PDF/A-1b, 2b, 3b, 2u, 3u, 2a or 3a for archiving. veraPDF validates the result and its text is compared before you get the file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-pdfa" },
  openGraph: {
    title: "PDF to PDF/A Converter — 1b to 3a, Checked by veraPDF",
    description: "Convert a PDF to PDF/A-1b, 2b, 3b, 2u, 3u, 2a or 3a for archiving. veraPDF validates the result and its text is compared before you get the file.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-pdfa",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-to-pdfa">{children}</ToolSeo>;
}
