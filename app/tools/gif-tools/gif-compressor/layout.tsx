import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "GIF Compressor — Compress GIF Online Free" },
  description: "GIF Compressor shrinks your animated GIF's file size while keeping the animation intact, entirely in your browser — nothing is uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-compressor" },
  openGraph: {
    title: "GIF Compressor — Compress GIF Online Free",
    description: "GIF Compressor shrinks your animated GIF's file size while keeping the animation intact, entirely in your browser — nothing is uploaded.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
