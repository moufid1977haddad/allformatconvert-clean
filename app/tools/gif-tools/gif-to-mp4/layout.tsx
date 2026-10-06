import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "GIF to MP4 Converter — H.264 Video with the Exact GIF Timing" },
  description: "Convert an animated GIF to a silent H.264 MP4 in your browser with ffmpeg.wasm. Every frame keeps its delay, and transparent areas turn white.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-mp4" },
  openGraph: {
    title: "GIF to MP4 Converter — H.264 Video with the Exact GIF Timing",
    description: "Convert an animated GIF to a silent H.264 MP4 in your browser with ffmpeg.wasm. Every frame keeps its delay, and transparent areas turn white.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-mp4",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/gif-to-mp4">{children}</ToolSeo>;
}
