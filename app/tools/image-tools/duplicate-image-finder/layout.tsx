import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Duplicate Image Finder — Exact and Resized Copies" },
  description: "Find duplicate photos in a batch: identical files by SHA-256, and the same picture resized or re-saved by a perceptual hash, computed on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/duplicate-image-finder" },
  openGraph: {
    title: "Duplicate Image Finder — Exact and Resized Copies",
    description: "Find duplicate photos in a batch: identical files by SHA-256, and the same picture resized or re-saved by a perceptual hash, computed on your device.",
    url: "https://www.onlineconvertools.com/tools/image-tools/duplicate-image-finder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/duplicate-image-finder">{children}</ToolSeo>;
}
