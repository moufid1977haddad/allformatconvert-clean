import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "ZIP Creator — Bundle Multiple Files Online Free" },
  description: "ZIP Creator bundles multiple files into a single ZIP archive, entirely in your browser — no upload, no software installation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/zip-creator" },
  openGraph: {
    title: "ZIP Creator — Bundle Multiple Files Online Free",
    description: "ZIP Creator bundles multiple files into a single ZIP archive, entirely in your browser — no upload, no software installation.",
    url: "https://www.onlineconvertools.com/tools/file-tools/zip-creator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
