import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Organize — Let You Reorder Online Free" },
  description: "PDF Organize lets you reorder and remove pages within a single PDF using Up, Down, and Remove buttons next to a list of pages, entirely in your browser…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-organize" },
  openGraph: {
    title: "PDF Organize — Let You Reorder Online Free",
    description: "PDF Organize lets you reorder and remove pages within a single PDF using Up, Down, and Remove buttons next to a list of pages, entirely in your browser…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-organize",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
