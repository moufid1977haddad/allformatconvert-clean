import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Cropper — Crop Images Online Free" },
  description: "Image Cropper lets you cut out a rectangular region of an image by entering exact X, Y, width, and height values in pixels.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-cropper" },
  openGraph: {
    title: "Image Cropper — Crop Images Online Free",
    description: "Image Cropper lets you cut out a rectangular region of an image by entering exact X, Y, width, and height values in pixels.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-cropper",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
