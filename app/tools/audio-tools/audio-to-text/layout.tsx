import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio to Text — Offer Two Ways Online Free" },
  description: "Audio to Text offers two ways to get a transcript: live microphone dictation using your browser's built-in Speech Recognition (works best in Chrome, entirely…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-to-text" },
  openGraph: {
    title: "Audio to Text — Offer Two Ways Online Free",
    description: "Audio to Text offers two ways to get a transcript: live microphone dictation using your browser's built-in Speech Recognition (works best in Chrome, entirely…",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-to-text",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
