import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image to PDF — Combine JPG, PNG, HEIC & More in One PDF" },
  description: "Combine JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF pictures into one PDF in your browser. Add files in several rounds and remove any before converting.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/image-to-pdf" },
  openGraph: {
    title: "Image to PDF — Combine JPG, PNG, HEIC & More in One PDF",
    description: "Combine JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF pictures into one PDF in your browser. Add files in several rounds and remove any before converting.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/image-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/image-to-pdf">{children}</ToolSeo>;
}
