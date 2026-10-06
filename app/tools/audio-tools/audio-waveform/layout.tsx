import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Waveform Image — Zoom, Pan, Save as PNG" },
  description: "Draw the waveform of an audio file, zoom up to 200x and pan, then save the visible part as a PNG up to 3000 px wide, in your colors or transparent.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-waveform" },
  openGraph: {
    title: "Audio Waveform Image — Zoom, Pan, Save as PNG",
    description: "Draw the waveform of an audio file, zoom up to 200x and pan, then save the visible part as a PNG up to 3000 px wide, in your colors or transparent.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-waveform",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-waveform">{children}</ToolSeo>;
}
