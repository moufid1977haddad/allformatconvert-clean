import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Merger — Join Audio Files, Reorder & Crossfade" },
  description: "Join two or more audio files in the order you set, end to end or with crossfades. 14 output formats; lossless inputs stay lossless by default.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-merger" },
  openGraph: {
    title: "Audio Merger — Join Audio Files, Reorder & Crossfade",
    description: "Join two or more audio files in the order you set, end to end or with crossfades. 14 output formats; lossless inputs stay lossless by default.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-merger",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-merger">{children}</ToolSeo>;
}
