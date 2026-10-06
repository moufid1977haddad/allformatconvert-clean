import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Equalizer — Bass, Mid & Treble, Export as WAV" },
  description: "Shape the bass, mids and treble of an audio file by up to 12 dB each while it plays, then export the result as a WAV file. Nothing is uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-equalizer" },
  openGraph: {
    title: "Audio Equalizer — Bass, Mid & Treble, Export as WAV",
    description: "Shape the bass, mids and treble of an audio file by up to 12 dB each while it plays, then export the result as a WAV file. Nothing is uploaded.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-equalizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-equalizer">{children}</ToolSeo>;
}
