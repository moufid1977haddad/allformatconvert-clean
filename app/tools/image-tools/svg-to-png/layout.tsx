import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "SVG to PNG — Rasterize a Vector SVG File Online Free" },
  description: "SVG to PNG rasterizes a vector SVG file into a PNG image at the exact pixel width and height you specify, entirely in your browser using the canvas element…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/svg-to-png" },
  openGraph: {
    title: "SVG to PNG — Rasterize a Vector SVG File Online Free",
    description: "SVG to PNG rasterizes a vector SVG file into a PNG image at the exact pixel width and height you specify, entirely in your browser using the canvas element…",
    url: "https://www.onlineconvertools.com/tools/image-tools/svg-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
