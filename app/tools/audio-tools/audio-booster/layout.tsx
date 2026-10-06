import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Booster — Make Audio Louder or Normalize to -16 LUFS" },
  description: "Raise or lower an audio file's volume from 0.25x to 5x, or even out its loudness, with a limiter that stops clipping. Save in 18 audio formats.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-booster" },
  openGraph: {
    title: "Audio Booster — Make Audio Louder or Normalize to -16 LUFS",
    description: "Raise or lower an audio file's volume from 0.25x to 5x, or even out its loudness, with a limiter that stops clipping. Save in 18 audio formats.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-booster",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-booster">{children}</ToolSeo>;
}
