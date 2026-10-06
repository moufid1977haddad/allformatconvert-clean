import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Compressor — Shrink Audio Files by Bitrate" },
  description: "Make an audio file smaller at 64 to 320 kbps, in mono or at a lower sample rate. Shows both sizes; never above the source bitrate when it can be read.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-compressor" },
  openGraph: {
    title: "Audio Compressor — Shrink Audio Files by Bitrate",
    description: "Make an audio file smaller at 64 to 320 kbps, in mono or at a lower sample rate. Shows both sizes; never above the source bitrate when it can be read.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-compressor">{children}</ToolSeo>;
}
