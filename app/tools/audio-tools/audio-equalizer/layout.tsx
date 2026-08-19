import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Equalizer — Equalize Audio Online Free" },
  description: "Audio Equalizer lets you shape an audio file's bass, mid, and treble in real time, then export the result as a downloadable WAV file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-equalizer" },
  openGraph: {
    title: "Audio Equalizer — Equalize Audio Online Free",
    description: "Audio Equalizer lets you shape an audio file's bass, mid, and treble in real time, then export the result as a downloadable WAV file.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-equalizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
