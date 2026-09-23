import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Compressor — Compress Images Online Free" },
  description: "Compress JPG, PNG and WebP in your browser, format and transparency kept: MozJPEG for photos, smart palettes for PNG. Batch and ZIP download.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-compressor" },
  openGraph: {
    title: "Image Compressor — Compress Images Online Free",
    description: "Compress JPG, PNG and WebP in your browser, format and transparency kept: MozJPEG for photos, smart palettes for PNG. Batch and ZIP download.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
