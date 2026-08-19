import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video to GIF — Capture a Series Online Free" },
  description: "Video to GIF captures a series of frames from any video file at your chosen frame rate and duration, then encodes them into a real GIF.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/video-to-gif" },
  openGraph: {
    title: "Video to GIF — Capture a Series Online Free",
    description: "Video to GIF captures a series of frames from any video file at your chosen frame rate and duration, then encodes them into a real GIF.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/video-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
