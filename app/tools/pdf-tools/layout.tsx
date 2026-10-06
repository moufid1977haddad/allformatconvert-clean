import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Tools: Merge, Split, Compress, Convert and Sign PDFs" },
  description: "39 PDF tools to merge, split, compress, edit, sign, protect, OCR and convert PDFs. Most run in your browser; each page says where the file goes.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools" },
  openGraph: {
    title: "PDF Tools: Merge, Split, Compress, Convert and Sign PDFs",
    description: "39 PDF tools to merge, split, compress, edit, sign, protect, OCR and convert PDFs. Most run in your browser; each page says where the file goes.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
