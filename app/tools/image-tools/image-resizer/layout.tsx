import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Resizer — Resize Images Online Free" },
  description: "Resize JPG, PNG and WebP by pixels or percentage with proportions locked, in the original format. In your browser, no upload.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-resizer" },
  openGraph: {
    title: "Image Resizer — Resize Images Online Free",
    description: "Resize JPG, PNG and WebP by pixels or percentage with proportions locked, in the original format. In your browser, no upload.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-resizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
