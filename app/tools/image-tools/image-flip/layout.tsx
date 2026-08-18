import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Flip — Mirror Your Image Horizontally or Vertically" },
  description: "Image Flip mirrors your image horizontally or vertically, entirely in your browser using the canvas element — your image is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-flip" },
  openGraph: {
    title: "Image Flip — Mirror Your Image Horizontally or Vertically",
    description: "Image Flip mirrors your image horizontally or vertically, entirely in your browser using the canvas element — your image is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-flip",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
