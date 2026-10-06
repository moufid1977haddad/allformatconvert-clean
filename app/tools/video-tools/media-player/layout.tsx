import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Media Player — Speed, Loop, Subtitles and Frame Capture" },
  description: "Play a local audio or video file in your browser at 0.5x to 2x speed, on loop, with SRT or VTT subtitles, picture-in-picture and a PNG of any frame.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/media-player" },
  openGraph: {
    title: "Media Player — Speed, Loop, Subtitles and Frame Capture",
    description: "Play a local audio or video file in your browser at 0.5x to 2x speed, on loop, with SRT or VTT subtitles, picture-in-picture and a PNG of any frame.",
    url: "https://www.onlineconvertools.com/tools/video-tools/media-player",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/media-player">{children}</ToolSeo>;
}
