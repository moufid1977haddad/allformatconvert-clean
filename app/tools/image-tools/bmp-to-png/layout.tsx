import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "BMP to PNG — Convert a BMP Image Online Free" },
  description: "BMP to PNG converts a BMP image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/bmp-to-png" },
  openGraph: {
    title: "BMP to PNG — Convert a BMP Image Online Free",
    description: "BMP to PNG converts a BMP image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/image-tools/bmp-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
