import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Metadata — Instantly Reads and Displays an Audio" },
  description: "Audio Metadata instantly reads and displays an audio file's basic properties — name, size, MIME type, last-modified date, and duration — directly in your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-metadata" },
  openGraph: {
    title: "Audio Metadata — Instantly Reads and Displays an Audio",
    description: "Audio Metadata instantly reads and displays an audio file's basic properties — name, size, MIME type, last-modified date, and duration — directly in your…",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
