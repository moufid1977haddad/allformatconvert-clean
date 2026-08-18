import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HEIC to JPG — Convert an Iphone HEIC Photo Online Free" },
  description: "HEIC to JPG converts an iPhone HEIC photo to standard JPG format entirely in your browser, using the open-source heic2any library — your photo is never…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/heic-to-jpg" },
  openGraph: {
    title: "HEIC to JPG — Convert an Iphone HEIC Photo Online Free",
    description: "HEIC to JPG converts an iPhone HEIC photo to standard JPG format entirely in your browser, using the open-source heic2any library — your photo is never…",
    url: "https://www.onlineconvertools.com/tools/image-tools/heic-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
