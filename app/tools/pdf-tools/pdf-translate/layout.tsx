import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Translate — Extract Text From the First 5 Pages Online" },
  description: "PDF Translate extracts text from the first 5 pages of your PDF in your browser, then sends it to OpenAI's API for translation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-translate" },
  openGraph: {
    title: "PDF Translate — Extract Text From the First 5 Pages Online",
    description: "PDF Translate extracts text from the first 5 pages of your PDF in your browser, then sends it to OpenAI's API for translation.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-translate",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
