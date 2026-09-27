import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Merger — Join Two or More Audio Files Online Free" },
  description: "Join two or more audio files seamlessly, in your browser: 14 output formats (FLAC, WAV, MP3, M4A, Opus…) with a choice of bitrate, and lossless files stay lossless.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-merger" },
  openGraph: {
    title: "Audio Merger — Join Two or More Audio Files Online Free",
    description: "Join two or more audio files seamlessly, in your browser: 14 output formats (FLAC, WAV, MP3, M4A, Opus…) with a choice of bitrate, and lossless files stay lossless.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-merger",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
