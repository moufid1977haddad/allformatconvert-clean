import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PNG to ICO — Resize Your PNG Online Free" },
  description: "PNG to ICO resizes your PNG to a chosen icon size and downloads it with a .ico file extension, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/png-to-ico" },
  openGraph: {
    title: "PNG to ICO — Resize Your PNG Online Free",
    description: "PNG to ICO resizes your PNG to a chosen icon size and downloads it with a .ico file extension, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/png-to-ico",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
