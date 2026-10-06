import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Compress PDF — Extreme, Recommended or Lossless" },
  description: "Shrink a PDF at one of three levels. Large pictures are resampled to their size on the page, fonts are optimized and the text is never rewritten.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress" },
  openGraph: {
    title: "Compress PDF — Extreme, Recommended or Lossless",
    description: "Shrink a PDF at one of three levels. Large pictures are resampled to their size on the page, fonts are optimized and the text is never rewritten.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-compress">{children}</ToolSeo>;
}
