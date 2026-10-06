import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "GIF to APNG Converter — Lossless Frames, Same Timing" },
  description: "Convert an animated GIF to an animated PNG (APNG) in your browser. Each frame is rebuilt as a GIF player shows it, and the play count is kept.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-apng" },
  openGraph: {
    title: "GIF to APNG Converter — Lossless Frames, Same Timing",
    description: "Convert an animated GIF to an animated PNG (APNG) in your browser. Each frame is rebuilt as a GIF player shows it, and the play count is kept.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-apng",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/gif-to-apng">{children}</ToolSeo>;
}
