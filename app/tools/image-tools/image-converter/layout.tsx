import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Converter — HEIC, RAW, PSD to JPG, PNG, WebP & More" },
  description: "Convert a batch of images to WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF. Opens HEIC, PSD, SVG and camera RAW files, all in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-converter" },
  openGraph: {
    title: "Image Converter — HEIC, RAW, PSD to JPG, PNG, WebP & More",
    description: "Convert a batch of images to WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF. Opens HEIC, PSD, SVG and camera RAW files, all in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-converter">{children}</ToolSeo>;
}
