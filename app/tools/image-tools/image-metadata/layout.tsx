import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Metadata Viewer — Read Basic File Information Online" },
  description: "Image Metadata Viewer reads basic file information from an image you upload — file name, file size, MIME type, pixel dimensions, and last-modified date…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-metadata" },
  openGraph: {
    title: "Image Metadata Viewer — Read Basic File Information Online",
    description: "Image Metadata Viewer reads basic file information from an image you upload — file name, file size, MIME type, pixel dimensions, and last-modified date…",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
