import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Metadata Viewer — Codec, Bitrate, Tags, Cover Art" },
  description: "See an audio file's codec, bitrate, sample rate, bit depth, tags, chapters and cover picture, read by ffprobe in your browser, and copy them as JSON.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-metadata" },
  openGraph: {
    title: "Audio Metadata Viewer — Codec, Bitrate, Tags, Cover Art",
    description: "See an audio file's codec, bitrate, sample rate, bit depth, tags, chapters and cover picture, read by ffprobe in your browser, and copy them as JSON.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-metadata">{children}</ToolSeo>;
}
