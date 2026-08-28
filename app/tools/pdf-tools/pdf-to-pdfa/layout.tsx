import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to PDF/A — Convert & Validate for Archiving Online" },
  description: "PDF to PDF/A converts your PDF for long-term archiving with Ghostscript, then validates it with veraPDF — you only get a file back if it's verified compliant.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-pdfa" },
  openGraph: {
    title: "PDF to PDF/A — Convert & Validate for Archiving Online",
    description: "PDF to PDF/A converts your PDF for long-term archiving with Ghostscript, then validates it with veraPDF — you only get a file back if it's verified compliant.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-pdfa",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
