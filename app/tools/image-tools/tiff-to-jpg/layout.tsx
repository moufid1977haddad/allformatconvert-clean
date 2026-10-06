import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "TIFF to JPG Converter — Any Page of a Multi-Page TIFF" },
  description: "Convert a TIF or TIFF scan or photo to JPG, with a quality slider and a choice of page for multi-page files. Decoded in a background worker.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-jpg" },
  openGraph: {
    title: "TIFF to JPG Converter — Any Page of a Multi-Page TIFF",
    description: "Convert a TIF or TIFF scan or photo to JPG, with a quality slider and a choice of page for multi-page files. Decoded in a background worker.",
    url: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/tiff-to-jpg">{children}</ToolSeo>;
}
