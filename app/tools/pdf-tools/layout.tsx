import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Tools — Merge, Split, Compress, and Convert PDFs Online" },
  description: "PDF Tools is a free online platform that allows users to edit, convert, merge, and manipulate PDF files without requiring software installation or paid…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools" },
  openGraph: {
    title: "PDF Tools — Merge, Split, Compress, and Convert PDFs Online",
    description: "PDF Tools is a free online platform that allows users to edit, convert, merge, and manipulate PDF files without requiring software installation or paid…",
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
