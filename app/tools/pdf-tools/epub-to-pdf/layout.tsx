import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "EPUB to PDF — Parse Your Ebook's Chapters, Images," },
  description: "EPUB to PDF parses your ebook's chapters, images, stylesheets, and cover right in your browser, using a dedicated EPUB parser rather than a naive…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/epub-to-pdf" },
  openGraph: {
    title: "EPUB to PDF — Parse Your Ebook's Chapters, Images,",
    description: "EPUB to PDF parses your ebook's chapters, images, stylesheets, and cover right in your browser, using a dedicated EPUB parser rather than a naive…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/epub-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
