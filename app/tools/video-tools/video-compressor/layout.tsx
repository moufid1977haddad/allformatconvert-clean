import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Compressor — Compress Videos Online Free" },
  description: "Video Compressor re-records your video at a lower bitrate using the browser's native MediaRecorder API, entirely client-side. Output is always WebM.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-compressor" },
  openGraph: {
    title: "Video Compressor — Compress Videos Online Free",
    description: "Video Compressor re-records your video at a lower bitrate using the browser's native MediaRecorder API, entirely client-side. Output is always WebM.",
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
