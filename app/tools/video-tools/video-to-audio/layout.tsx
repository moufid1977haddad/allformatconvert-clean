import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video to Audio — Extract Sound as MP3, WAV, FLAC & More" },
  description: "Pull the sound out of a video as MP3, WAV, AAC, FLAC, M4A, Opus or 12 other audio formats, with ffmpeg.wasm running in this browser tab, no upload.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-to-audio" },
  openGraph: {
    title: "Video to Audio — Extract Sound as MP3, WAV, FLAC & More",
    description: "Pull the sound out of a video as MP3, WAV, AAC, FLAC, M4A, Opus or 12 other audio formats, with ffmpeg.wasm running in this browser tab, no upload.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-to-audio",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-to-audio">{children}</ToolSeo>;
}
