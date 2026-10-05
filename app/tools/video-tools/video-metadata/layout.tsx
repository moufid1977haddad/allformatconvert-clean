import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Metadata — Read a Video File's Basic Properties Online" },
  description: "Video Metadata shows a video's codecs, bitrate, frame rate, resolution, rotation, audio tracks, subtitles and tags — read in your browser, nothing uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-metadata" },
  openGraph: {
    title: "Video Metadata — Read a Video File's Basic Properties Online",
    description: "Video Metadata shows a video's codecs, bitrate, frame rate, resolution, rotation, audio tracks, subtitles and tags — read in your browser, nothing uploaded.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-metadata">{children}</ToolSeo>;
}
