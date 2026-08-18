import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "XML Formatter — Re-indent XML Online Free" },
  description: "XML Formatter re-indents XML using line-based text processing, not a real XML parser, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/xml-formatter" },
  openGraph: {
    title: "XML Formatter — Re-indent XML Online Free",
    description: "XML Formatter re-indents XML using line-based text processing, not a real XML parser, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/xml-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
