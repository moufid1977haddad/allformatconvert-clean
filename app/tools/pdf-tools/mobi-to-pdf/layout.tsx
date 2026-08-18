import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "MOBI to PDF — Properly Decodes Your Kindle Ebook's Internal" },
  description: "MOBI to PDF properly decodes your Kindle ebook's internal PalmDOC or Huffman/CDIC text compression and the newer KF8 structure used by .azw3 files, right…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/mobi-to-pdf" },
  openGraph: {
    title: "MOBI to PDF — Properly Decodes Your Kindle Ebook's Internal",
    description: "MOBI to PDF properly decodes your Kindle ebook's internal PalmDOC or Huffman/CDIC text compression and the newer KF8 structure used by .azw3 files, right…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/mobi-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
