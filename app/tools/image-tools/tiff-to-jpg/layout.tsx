import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "TIFF to JPG — Convert a TIFF Image Online Free" },
  description: "TIFF to JPG converts a TIFF image to JPG format entirely in your browser using the open-source UTIF.js decoder — your file is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-jpg" },
  openGraph: {
    title: "TIFF to JPG — Convert a TIFF Image Online Free",
    description: "TIFF to JPG converts a TIFF image to JPG format entirely in your browser using the open-source UTIF.js decoder — your file is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
