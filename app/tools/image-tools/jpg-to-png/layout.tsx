import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JPG to PNG Converter — Lossless Copy for Editing, Free" },
  description: "Convert a JPG or JPEG photo into a PNG at full size, stored the right way up. Made on this page by your browser; the photo is never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/jpg-to-png" },
  openGraph: {
    title: "JPG to PNG Converter — Lossless Copy for Editing, Free",
    description: "Convert a JPG or JPEG photo into a PNG at full size, stored the right way up. Made on this page by your browser; the photo is never uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/jpg-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/jpg-to-png">{children}</ToolSeo>;
}
