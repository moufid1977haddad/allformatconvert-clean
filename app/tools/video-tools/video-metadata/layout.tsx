import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Metadata Viewer — Codecs, Frame Rate, GPS Removal" },
  description: "Read a video's codecs, resolution, frame rate, rotation, audio and subtitle tracks with ffprobe in your browser, or save a copy without metadata.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-metadata" },
  openGraph: {
    title: "Video Metadata Viewer — Codecs, Frame Rate, GPS Removal",
    description: "Read a video's codecs, resolution, frame rate, rotation, audio and subtitle tracks with ffprobe in your browser, or save a copy without metadata.",
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
