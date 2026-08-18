import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Add Text to Image — Overlay a Single Line Online Free" },
  description: "Add Text to Image overlays a single line of text onto your photo, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-text-to-image" },
  openGraph: {
    title: "Add Text to Image — Overlay a Single Line Online Free",
    description: "Add Text to Image overlays a single line of text onto your photo, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-text-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
