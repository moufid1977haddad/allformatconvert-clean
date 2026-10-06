import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "TIFF to PNG Converter — Lossless, Transparency Kept, Free" },
  description: "Turn a TIF or TIFF image into a lossless PNG that keeps transparency, and choose the page of a multi-page file. Read in a background worker.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-png" },
  openGraph: {
    title: "TIFF to PNG Converter — Lossless, Transparency Kept, Free",
    description: "Turn a TIF or TIFF image into a lossless PNG that keeps transparency, and choose the page of a multi-page file. Read in a background worker.",
    url: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/tiff-to-png">{children}</ToolSeo>;
}
