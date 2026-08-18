import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Tools — Convert, Compress, and Edit Audio Files Online" },
  description: "Audio Tools is a comprehensive free online platform offering a suite of audio processing utilities designed to enhance, convert, and edit sound files…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools" },
  openGraph: {
    title: "Audio Tools — Convert, Compress, and Edit Audio Files Online",
    description: "Audio Tools is a comprehensive free online platform offering a suite of audio processing utilities designed to enhance, convert, and edit sound files…",
    url: "https://www.onlineconvertools.com/tools/audio-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
