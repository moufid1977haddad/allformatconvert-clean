import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to JPG — Pages or Embedded Images, Online Free" },
  description: "PDF to JPG: each page as a JPG at 72, 150 or 300 dpi, or the pictures inside the PDF extracted. Choose pages; in your browser, no upload.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg" },
  openGraph: {
    title: "PDF to JPG — Pages or Embedded Images, Online Free",
    description: "PDF to JPG: each page as a JPG at 72, 150 or 300 dpi, or the pictures inside the PDF extracted. Choose pages; in your browser, no upload.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
