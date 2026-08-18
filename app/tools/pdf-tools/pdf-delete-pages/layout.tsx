import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Delete Pages — Remove the Page Numbers You Specify" },
  description: "PDF Delete Pages removes the page numbers you specify from a PDF entirely in your browser using the pdf-lib library — your file is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-delete-pages" },
  openGraph: {
    title: "PDF Delete Pages — Remove the Page Numbers You Specify",
    description: "PDF Delete Pages removes the page numbers you specify from a PDF entirely in your browser using the pdf-lib library — your file is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-delete-pages",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
