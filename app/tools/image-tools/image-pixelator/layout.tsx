import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Pixelator — Pixelate Images Online Free" },
  description: "Image Pixelator applies a mosaic effect across your image by averaging blocks of pixels at a size you choose, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-pixelator" },
  openGraph: {
    title: "Image Pixelator — Pixelate Images Online Free",
    description: "Image Pixelator applies a mosaic effect across your image by averaging blocks of pixels at a size you choose, in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-pixelator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
