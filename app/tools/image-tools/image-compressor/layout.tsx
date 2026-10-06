import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Compressor — JPG, PNG, WebP, AVIF and SVG, Format Kept" },
  description: "Compress up to 20 images at once, each kept in its own format, by quality or to a size in KB. MozJPEG, PNG palettes and SVGO, all in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-compressor" },
  openGraph: {
    title: "Image Compressor — JPG, PNG, WebP, AVIF and SVG, Format Kept",
    description: "Compress up to 20 images at once, each kept in its own format, by quality or to a size in KB. MozJPEG, PNG palettes and SVGO, all in your browser.",
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
