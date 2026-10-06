import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Tools: Convert HEIC, Resize, Compress and Edit Photos" },
  description: "37 image tools to convert HEIC, WebP, PNG, JPG and TIFF, resize, crop, compress, add effects and strip EXIF data, with the work done in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools" },
  openGraph: {
    title: "Image Tools: Convert HEIC, Resize, Compress and Edit Photos",
    description: "37 image tools to convert HEIC, WebP, PNG, JPG and TIFF, resize, crop, compress, add effects and strip EXIF data, with the work done in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
