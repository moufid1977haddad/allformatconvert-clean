import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "GIF to APNG — Decode Every Frame Online Free" },
  description: "GIF to APNG decodes every frame of your GIF and re-encodes it into a real, downloadable animated PNG, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-apng" },
  openGraph: {
    title: "GIF to APNG — Decode Every Frame Online Free",
    description: "GIF to APNG decodes every frame of your GIF and re-encodes it into a real, downloadable animated PNG, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-apng",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
