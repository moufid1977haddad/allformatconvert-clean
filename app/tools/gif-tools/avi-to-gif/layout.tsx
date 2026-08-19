import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AVI to GIF — Extract Up to 10 Evenly Spaced Frames Online" },
  description: "AVI to GIF extracts up to 10 evenly spaced frames from your AVI video and encodes them into a real, downloadable animated GIF.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/avi-to-gif" },
  openGraph: {
    title: "AVI to GIF — Extract Up to 10 Evenly Spaced Frames Online",
    description: "AVI to GIF extracts up to 10 evenly spaced frames from your AVI video and encodes them into a real, downloadable animated GIF.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/avi-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
