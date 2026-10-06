import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "SVG to PNG — Choose the Pixel Size and Background, Free" },
  description: "Rasterize an SVG into a PNG at the width and height you set, or 512, 1024 or 2048 px wide, on a transparent or coloured background. In-browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/svg-to-png" },
  openGraph: {
    title: "SVG to PNG — Choose the Pixel Size and Background, Free",
    description: "Rasterize an SVG into a PNG at the width and height you set, or 512, 1024 or 2048 px wide, on a transparent or coloured background. In-browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/svg-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/svg-to-png">{children}</ToolSeo>;
}
