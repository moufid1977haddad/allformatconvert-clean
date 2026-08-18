import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Watermark — Stamp a Diagonal, Semi-transparent Text" },
  description: "PDF Watermark stamps a diagonal, semi-transparent text watermark across the center of every page, using the pdf-lib library entirely in your browser — your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-watermark" },
  openGraph: {
    title: "PDF Watermark — Stamp a Diagonal, Semi-transparent Text",
    description: "PDF Watermark stamps a diagonal, semi-transparent text watermark across the center of every page, using the pdf-lib library entirely in your browser — your…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-watermark",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
