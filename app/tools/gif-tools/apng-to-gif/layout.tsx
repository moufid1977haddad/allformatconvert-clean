import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "APNG to GIF — Decode Every Frame Online Free" },
  description: "APNG to GIF decodes every frame of your animated PNG (using the upng-js library) and re-encodes them into a real, downloadable animated GIF (using gifenc)…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/apng-to-gif" },
  openGraph: {
    title: "APNG to GIF — Decode Every Frame Online Free",
    description: "APNG to GIF decodes every frame of your animated PNG (using the upng-js library) and re-encodes them into a real, downloadable animated GIF (using gifenc)…",
    url: "https://www.onlineconvertools.com/tools/gif-tools/apng-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
