import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video to GIF — Clip Any Video into an Animated GIF" },
  description: "Turn a clip of any video (MP4, MOV, WebM…) into an animated GIF: choose start, length up to 60 s, width and frame rate. Any browser, iPhone included.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/video-to-gif" },
  openGraph: {
    title: "Video to GIF — Clip Any Video into an Animated GIF",
    description: "Turn a clip of any video (MP4, MOV, WebM…) into an animated GIF: choose start, length up to 60 s, width and frame rate. Any browser, iPhone included.",
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
