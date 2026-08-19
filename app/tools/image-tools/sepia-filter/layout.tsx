import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Sepia Filter — Apply a Warm, Vintage Brown Tone Online Free" },
  description: "Sepia Filter applies a warm, vintage brown tone to your photo using a sepia color matrix, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/sepia-filter" },
  openGraph: {
    title: "Sepia Filter — Apply a Warm, Vintage Brown Tone Online Free",
    description: "Sepia Filter applies a warm, vintage brown tone to your photo using a sepia color matrix, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/sepia-filter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
