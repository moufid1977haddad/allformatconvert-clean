import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Metadata — Read a Video File's Basic Properties Online" },
  description: "Video Metadata reads a video file's basic properties — name, size, type, duration, resolution, and last-modified date — directly in your browser…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-metadata" },
  openGraph: {
    title: "Video Metadata — Read a Video File's Basic Properties Online",
    description: "Video Metadata reads a video file's basic properties — name, size, type, duration, resolution, and last-modified date — directly in your browser…",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
