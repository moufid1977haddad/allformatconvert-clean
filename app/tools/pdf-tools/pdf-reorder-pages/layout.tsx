import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Reorder Pages — Let You Rearrange a Pdf's Pages Online" },
  description: "PDF Reorder Pages lets you rearrange a PDF's pages by typing the new page order as a comma-separated list, using the pdf-lib library entirely in your browser…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-reorder-pages" },
  openGraph: {
    title: "PDF Reorder Pages — Let You Rearrange a Pdf's Pages Online",
    description: "PDF Reorder Pages lets you rearrange a PDF's pages by typing the new page order as a comma-separated list, using the pdf-lib library entirely in your browser…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-reorder-pages",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
