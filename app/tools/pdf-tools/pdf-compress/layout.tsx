import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Compress PDF — Three Levels, Lossless Included" },
  description: "Compress PDF files with three levels: Extreme, Recommended or Lossless. Images recompressed from their real size on the page, fonts optimised, text never rewritten.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress" },
  openGraph: {
    title: "Compress PDF — Three Levels, Lossless Included",
    description: "Compress PDF files with three levels: Extreme, Recommended or Lossless. Images recompressed from their real size on the page, fonts optimised, text never rewritten.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
