import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Resizer — Redraw Your Video Online Free" },
  description: "Video Resizer redraws your video at a new width and height on a canvas and records the result, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-resizer" },
  openGraph: {
    title: "Video Resizer — Redraw Your Video Online Free",
    description: "Video Resizer redraws your video at a new width and height on a canvas and records the result, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-resizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
