import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Extract Text — Pull the Text Layer Out Online Free" },
  description: "PDF Extract Text pulls the text layer out of your PDF page by page, entirely in your browser using the PDF.js library — your file is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-extract-text" },
  openGraph: {
    title: "PDF Extract Text — Pull the Text Layer Out Online Free",
    description: "PDF Extract Text pulls the text layer out of your PDF page by page, entirely in your browser using the PDF.js library — your file is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-extract-text",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
