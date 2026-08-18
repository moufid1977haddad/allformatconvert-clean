import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Media Player — Play a Single Audio or Video File Online Free" },
  description: "Media Player plays a single audio or video file directly in your browser using native HTML5 playback — the file loads locally as a blob URL and is never…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/media-player" },
  openGraph: {
    title: "Media Player — Play a Single Audio or Video File Online Free",
    description: "Media Player plays a single audio or video file directly in your browser using native HTML5 playback — the file loads locally as a blob URL and is never…",
    url: "https://www.onlineconvertools.com/tools/video-tools/media-player",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
