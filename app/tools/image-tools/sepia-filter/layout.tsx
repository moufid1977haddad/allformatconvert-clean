import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Sepia Filter — Vintage Brown Tone With Intensity Slider" },
  description: "Give a photo the warm brown tone of old prints with the standard sepia matrix, at an intensity from 0 to 100. JPG, PNG and WebP keep their format.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/sepia-filter" },
  openGraph: {
    title: "Sepia Filter — Vintage Brown Tone With Intensity Slider",
    description: "Give a photo the warm brown tone of old prints with the standard sepia matrix, at an intensity from 0 to 100. JPG, PNG and WebP keep their format.",
    url: "https://www.onlineconvertools.com/tools/image-tools/sepia-filter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/sepia-filter">{children}</ToolSeo>;
}
