import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Converter — Re-encode Your Video to Webm Online Free" },
  description: "Video Converter re-encodes your video to WebM using the browser's native MediaRecorder API, entirely client-side.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-converter" },
  openGraph: {
    title: "Video Converter — Re-encode Your Video to Webm Online Free",
    description: "Video Converter re-encodes your video to WebM using the browser's native MediaRecorder API, entirely client-side.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
