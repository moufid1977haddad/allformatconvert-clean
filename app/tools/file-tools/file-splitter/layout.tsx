import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Splitter — Divide Any File Online Free" },
  description: "File Splitter is a free online tool that divides any file into smaller, numbered parts by size — entirely in your browser, with nothing uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-splitter" },
  openGraph: {
    title: "File Splitter — Divide Any File Online Free",
    description: "File Splitter is a free online tool that divides any file into smaller, numbered parts by size — entirely in your browser, with nothing uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-splitter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
