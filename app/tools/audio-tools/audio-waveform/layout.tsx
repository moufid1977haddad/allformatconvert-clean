import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Waveform — Draw an Interactive Visual Waveform Online" },
  description: "Audio Waveform draws an interactive visual waveform of your audio file directly in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-waveform" },
  openGraph: {
    title: "Audio Waveform — Draw an Interactive Visual Waveform Online",
    description: "Audio Waveform draws an interactive visual waveform of your audio file directly in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-waveform",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
