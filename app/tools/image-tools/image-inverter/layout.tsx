import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Inverter — Create a Photo-negative Effect Online Free" },
  description: "Image Inverter creates a photo-negative effect by subtracting each pixel's red, green, and blue values from 255, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-inverter" },
  openGraph: {
    title: "Image Inverter — Create a Photo-negative Effect Online Free",
    description: "Image Inverter creates a photo-negative effect by subtracting each pixel's red, green, and blue values from 255, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-inverter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
