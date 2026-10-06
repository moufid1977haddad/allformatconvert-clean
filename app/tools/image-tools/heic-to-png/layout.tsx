import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "HEIC to PNG — Lossless Copy of an iPhone Photo, Free" },
  description: "Save an iPhone HEIC or HEIF photo as a lossless PNG, with no quality setting to choose. The photo is decoded on your own device, never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/heic-to-png" },
  openGraph: {
    title: "HEIC to PNG — Lossless Copy of an iPhone Photo, Free",
    description: "Save an iPhone HEIC or HEIF photo as a lossless PNG, with no quality setting to choose. The photo is decoded on your own device, never uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/heic-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/heic-to-png">{children}</ToolSeo>;
}
