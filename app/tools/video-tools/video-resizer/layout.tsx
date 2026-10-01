import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Resizer — Resize a Video Online Free" },
  description: "Video Resizer changes your video's width and height on our own server (fit with black bars, fill or stretch), in every browser including Safari and iPhone, and gives an MP4 with the original sound.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-resizer" },
  openGraph: {
    title: "Video Resizer — Resize a Video Online Free",
    description: "Video Resizer changes your video's width and height on our own server (fit with black bars, fill or stretch), in every browser including Safari and iPhone, and gives an MP4 with the original sound.",
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
