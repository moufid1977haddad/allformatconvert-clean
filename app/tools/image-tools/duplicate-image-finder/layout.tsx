import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Duplicate Image Finder — Scan a Batch Online Free" },
  description: "Duplicate Image Finder scans a batch of images you select and flags pairs that are byte-for-byte identical, entirely in your browser — nothing is uploaded…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/duplicate-image-finder" },
  openGraph: {
    title: "Duplicate Image Finder — Scan a Batch Online Free",
    description: "Duplicate Image Finder scans a batch of images you select and flags pairs that are byte-for-byte identical, entirely in your browser — nothing is uploaded…",
    url: "https://www.onlineconvertools.com/tools/image-tools/duplicate-image-finder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
