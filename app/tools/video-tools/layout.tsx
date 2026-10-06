import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Tools: Compress, Convert, Trim and Merge Videos" },
  description: "15 video tools to compress, convert, trim, merge, rotate, resize and record. Re-encoding runs on our own media service; extraction runs in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools" },
  openGraph: {
    title: "Video Tools: Compress, Convert, Trim and Merge Videos",
    description: "15 video tools to compress, convert, trim, merge, rotate, resize and record. Re-encoding runs on our own media service; extraction runs in your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
