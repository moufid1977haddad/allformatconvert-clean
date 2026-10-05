import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Metadata — Instantly Reads and Displays an Audio" },
  description: "Audio Metadata shows an audio file's codec, bitrate, sample rate, channels, bit depth, tags and cover art — read in your browser, nothing uploaded, any file size.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-metadata" },
  openGraph: {
    title: "Audio Metadata — Instantly Reads and Displays an Audio",
    description: "Audio Metadata shows an audio file's codec, bitrate, sample rate, channels, bit depth, tags and cover art — read in your browser, nothing uploaded, any file size.",
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
