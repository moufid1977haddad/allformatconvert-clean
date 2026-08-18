import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "ZIP Extractor — Extract ZIP Online Free" },
  description: "ZIP Extractor is a free online tool that extracts files from a ZIP archive directly in your browser using JSZip — no upload, no software required.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/zip-extractor" },
  openGraph: {
    title: "ZIP Extractor — Extract ZIP Online Free",
    description: "ZIP Extractor is a free online tool that extracts files from a ZIP archive directly in your browser using JSZip — no upload, no software required.",
    url: "https://www.onlineconvertools.com/tools/file-tools/zip-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
