import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Merger — Play Your Videos Back-to-back Online Free" },
  description: "Video Merger plays your videos back-to-back onto a canvas and records the result as one file, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-merger" },
  openGraph: {
    title: "Video Merger — Play Your Videos Back-to-back Online Free",
    description: "Video Merger plays your videos back-to-back onto a canvas and records the result as one file, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-merger",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
