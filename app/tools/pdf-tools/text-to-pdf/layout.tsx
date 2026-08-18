import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text to PDF — Convert Plain Text Online Free" },
  description: "Text to PDF converts plain text — pasted directly or from an uploaded .txt file — into a PDF using the pdf-lib library entirely in your browser,…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/text-to-pdf" },
  openGraph: {
    title: "Text to PDF — Convert Plain Text Online Free",
    description: "Text to PDF converts plain text — pasted directly or from an uploaded .txt file — into a PDF using the pdf-lib library entirely in your browser,…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/text-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
