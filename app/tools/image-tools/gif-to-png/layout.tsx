import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "GIF to PNG — First Frame, or Every Frame in a ZIP" },
  description: "Save a GIF as a PNG picture, or split an animated GIF into numbered PNG frames packed in one ZIP. Decoded in your browser; the GIF is never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/gif-to-png" },
  openGraph: {
    title: "GIF to PNG — First Frame, or Every Frame in a ZIP",
    description: "Save a GIF as a PNG picture, or split an animated GIF into numbered PNG frames packed in one ZIP. Decoded in your browser; the GIF is never uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/gif-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/gif-to-png">{children}</ToolSeo>;
}
