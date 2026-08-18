import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video to Audio — Extract the Audio Track Online Free" },
  description: "Video to Audio extracts the audio track from a video file using the Web Audio API, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-to-audio" },
  openGraph: {
    title: "Video to Audio — Extract the Audio Track Online Free",
    description: "Video to Audio extracts the audio track from a video file using the Web Audio API, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-to-audio",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
