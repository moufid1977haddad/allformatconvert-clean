import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Compare PDF — Extract the Text Content Online Free" },
  description: "Compare PDF extracts the text content of two PDF files entirely in your browser using the PDF.js library, then displays both extractions side by side…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compare" },
  openGraph: {
    title: "Compare PDF — Extract the Text Content Online Free",
    description: "Compare PDF extracts the text content of two PDF files entirely in your browser using the PDF.js library, then displays both extractions side by side…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compare",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
