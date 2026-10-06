import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Pixelate Image — Mosaic Blocks in Pixels or Percent" },
  description: "Pixelate a whole picture into averaged square blocks of 2 to 50 px, or 1 to 20% of the shorter side. JPG, PNG and WebP keep their format.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-pixelator" },
  openGraph: {
    title: "Pixelate Image — Mosaic Blocks in Pixels or Percent",
    description: "Pixelate a whole picture into averaged square blocks of 2 to 50 px, or 1 to 20% of the shorter side. JPG, PNG and WebP keep their format.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-pixelator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-pixelator">{children}</ToolSeo>;
}
