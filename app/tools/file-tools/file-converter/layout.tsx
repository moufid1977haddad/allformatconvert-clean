import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Converter — Convert Plain-text-based Files Online Free" },
  description: "File Converter is a free online tool that converts plain-text-based files between TXT, JSON, CSV, and HTML formats — entirely in your browser, with nothing…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-converter" },
  openGraph: {
    title: "File Converter — Convert Plain-text-based Files Online Free",
    description: "File Converter is a free online tool that converts plain-text-based files between TXT, JSON, CSV, and HTML formats — entirely in your browser, with nothing…",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
