import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video to GIF — Extract a Series Online Free" },
  description: "Video to GIF extracts a series of still frames from your video, entirely in your browser, with adjustable frame rate and duration.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-to-gif" },
  openGraph: {
    title: "Video to GIF — Extract a Series Online Free",
    description: "Video to GIF extracts a series of still frames from your video, entirely in your browser, with adjustable frame rate and duration.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
