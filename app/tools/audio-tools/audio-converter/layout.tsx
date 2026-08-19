import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Converter — Convert a Single Audio File Online Free" },
  description: "Audio Converter converts a single audio file between MP3, WAV, AAC, FLAC, OGG, M4A, and Opus, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-converter" },
  openGraph: {
    title: "Audio Converter — Convert a Single Audio File Online Free",
    description: "Audio Converter converts a single audio file between MP3, WAV, AAC, FLAC, OGG, M4A, and Opus, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
