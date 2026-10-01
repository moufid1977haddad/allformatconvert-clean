import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "EPUB to PDF — Parse Your Ebook's Chapters, Images," },
  description: "EPUB to PDF reads your ebook's chapters, images, stylesheets and cover in your browser, then our own conversion service prints them to a real PDF and deletes them right after.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/epub-to-pdf" },
  openGraph: {
    title: "EPUB to PDF — Parse Your Ebook's Chapters, Images,",
    description: "EPUB to PDF reads your ebook's chapters, images, stylesheets and cover in your browser, then our own conversion service prints them to a real PDF and deletes them right after.",
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
