import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "WebP to JPG — Convert a Webp Image Online Free" },
  description: "WebP to JPG converts a WebP image to JPG format entirely in your browser using the HTML canvas — your file is never uploaded to a server, and nothing…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/webp-to-jpg" },
  openGraph: {
    title: "WebP to JPG — Convert a Webp Image Online Free",
    description: "WebP to JPG converts a WebP image to JPG format entirely in your browser using the HTML canvas — your file is never uploaded to a server, and nothing…",
    url: "https://www.onlineconvertools.com/tools/image-tools/webp-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
