import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "GIF Compressor — Lossy Level, Fewer Colors, Smaller Size" },
  description: "Shrink an animated GIF with gifsicle in your browser: choose the quality, fewer colors or a smaller size, and compare the file size before and after.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-compressor" },
  openGraph: {
    title: "GIF Compressor — Lossy Level, Fewer Colors, Smaller Size",
    description: "Shrink an animated GIF with gifsicle in your browser: choose the quality, fewer colors or a smaller size, and compare the file size before and after.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/gif-compressor">{children}</ToolSeo>;
}
