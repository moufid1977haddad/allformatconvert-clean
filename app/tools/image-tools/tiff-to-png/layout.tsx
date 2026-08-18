import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "TIFF to PNG — Convert a TIFF Image Online Free" },
  description: "TIFF to PNG converts a TIFF image to PNG format entirely in your browser using the open-source UTIF.js decoder — your file is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-png" },
  openGraph: {
    title: "TIFF to PNG — Convert a TIFF Image Online Free",
    description: "TIFF to PNG converts a TIFF image to PNG format entirely in your browser using the open-source UTIF.js decoder — your file is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/image-tools/tiff-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
