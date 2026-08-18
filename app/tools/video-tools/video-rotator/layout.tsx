import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Rotator — Rotate Your Video Online Free" },
  description: "Video Rotator rotates your video by 90°, 180°, or 270° by redrawing each frame on a rotated canvas and recording the result, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-rotator" },
  openGraph: {
    title: "Video Rotator — Rotate Your Video Online Free",
    description: "Video Rotator rotates your video by 90°, 180°, or 270° by redrawing each frame on a rotated canvas and recording the result, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-rotator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
