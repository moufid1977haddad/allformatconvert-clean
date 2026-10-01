import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Compressor — Compress Videos Online Free" },
  description: "Video Compressor shrinks your video with the H.264 encoder on our own server, so it works in every browser including Safari and iPhone, and gives an MP4 that plays everywhere. Files up to 1 GB, deleted after download.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-compressor" },
  openGraph: {
    title: "Video Compressor — Compress Videos Online Free",
    description: "Video Compressor shrinks your video with the H.264 encoder on our own server, so it works in every browser including Safari and iPhone, and gives an MP4 that plays everywhere. Files up to 1 GB, deleted after download.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
