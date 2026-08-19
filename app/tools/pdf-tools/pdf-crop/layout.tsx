import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Crop — Trim Each Page's Crop Box Online Free" },
  description: "PDF Crop trims each page's crop box by the top, bottom, left, and right margins you enter, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-crop" },
  openGraph: {
    title: "PDF Crop — Trim Each Page's Crop Box Online Free",
    description: "PDF Crop trims each page's crop box by the top, bottom, left, and right margins you enter, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-crop",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
