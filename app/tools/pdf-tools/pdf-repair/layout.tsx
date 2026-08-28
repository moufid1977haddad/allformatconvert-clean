import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Repair — Fix Damaged PDF Files Online" },
  description: "PDF Repair fixes PDFs with damaged structure, like a broken cross-reference table, using qpdf and Ghostscript on our server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-repair" },
  openGraph: {
    title: "PDF Repair — Fix Damaged PDF Files Online",
    description: "PDF Repair fixes PDFs with damaged structure, like a broken cross-reference table, using qpdf and Ghostscript on our server.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-repair",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
