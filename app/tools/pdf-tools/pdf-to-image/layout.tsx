import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to Image — Pages as PNG, JPG, WebP, TIFF or BMP Free" },
  description: "Turn PDF pages into PNG, JPG, WebP, TIFF or BMP pictures at Normal, High or Screen resolution, or pull out the pictures inside. ZIP for many files.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-image" },
  openGraph: {
    title: "PDF to Image — Pages as PNG, JPG, WebP, TIFF or BMP Free",
    description: "Turn PDF pages into PNG, JPG, WebP, TIFF or BMP pictures at Normal, High or Screen resolution, or pull out the pictures inside. ZIP for many files.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-to-image">{children}</ToolSeo>;
}
