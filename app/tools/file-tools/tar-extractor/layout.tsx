import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "TAR Extractor — Extract TAR Online Free" },
  description: "TAR Extractor is a free online tool that extracts files from plain, uncompressed TAR archives directly in your browser — no software or upload required.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/tar-extractor" },
  openGraph: {
    title: "TAR Extractor — Extract TAR Online Free",
    description: "TAR Extractor is a free online tool that extracts files from plain, uncompressed TAR archives directly in your browser — no software or upload required.",
    url: "https://www.onlineconvertools.com/tools/file-tools/tar-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
