import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Round Corners — Clip Your Image Online Free" },
  description: "Round Corners clips your image to a rounded-rectangle shape at a radius you choose, entirely in your browser using the canvas element.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/round-corners" },
  openGraph: {
    title: "Round Corners — Clip Your Image Online Free",
    description: "Round Corners clips your image to a rounded-rectangle shape at a radius you choose, entirely in your browser using the canvas element.",
    url: "https://www.onlineconvertools.com/tools/image-tools/round-corners",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
