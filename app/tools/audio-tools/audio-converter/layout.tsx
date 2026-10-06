import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Converter — MP3, WAV, M4A, FLAC, OGG & More" },
  description: "Convert one audio file to any of 18 formats, including M4R ringtones, ALAC and WavPack, with bitrate, sample rate and channel choices. Free.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-converter" },
  openGraph: {
    title: "Audio Converter — MP3, WAV, M4A, FLAC, OGG & More",
    description: "Convert one audio file to any of 18 formats, including M4R ringtones, ALAC and WavPack, with bitrate, sample rate and channel choices. Free.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-converter">{children}</ToolSeo>;
}
