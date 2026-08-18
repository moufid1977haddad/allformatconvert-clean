import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Rotate — Turn Your Image Online Free" },
  description: "Image Rotate turns your image by a preset (90°, 180°, 270°) or custom angle, entirely in your browser using the canvas element — your image is never uploaded…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-rotate" },
  openGraph: {
    title: "Image Rotate — Turn Your Image Online Free",
    description: "Image Rotate turns your image by a preset (90°, 180°, 270°) or custom angle, entirely in your browser using the canvas element — your image is never uploaded…",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-rotate",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
