import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Compressor — Compress Images Online Free" },
  description: "Compress JPG, PNG, WebP, AVIF and SVG in your browser, format and transparency kept: MozJPEG for photos, smart palettes for PNG, SVGO for SVG. Batch and ZIP download.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-compressor" },
  openGraph: {
    title: "Image Compressor — Compress Images Online Free",
    description: "Compress JPG, PNG, WebP, AVIF and SVG in your browser, format and transparency kept: MozJPEG for photos, smart palettes for PNG, SVGO for SVG. Batch and ZIP download.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-compressor">{children}</ToolSeo>;
}
