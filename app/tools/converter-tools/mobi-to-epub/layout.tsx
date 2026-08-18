import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "MOBI to EPUB — Convert Your Kindle Ebook Online Free" },
  description: "MOBI to EPUB converts your Kindle ebook into a real, standards-compliant EPUB file entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/mobi-to-epub" },
  openGraph: {
    title: "MOBI to EPUB — Convert Your Kindle Ebook Online Free",
    description: "MOBI to EPUB converts your Kindle ebook into a real, standards-compliant EPUB file entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/mobi-to-epub",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
