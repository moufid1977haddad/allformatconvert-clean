import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "GIF Maker — Turn a Sequence Online Free" },
  description: "GIF Maker turns a sequence of photos or graphics into a real, downloadable animated GIF, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-maker" },
  openGraph: {
    title: "GIF Maker — Turn a Sequence Online Free",
    description: "GIF Maker turns a sequence of photos or graphics into a real, downloadable animated GIF, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-maker",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
