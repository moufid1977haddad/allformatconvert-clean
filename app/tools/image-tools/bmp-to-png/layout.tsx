import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "BMP to PNG Converter — Lossless PNG, Same Name and Size" },
  description: "Save a Windows .bmp bitmap as a PNG with the same width, height and name, stored losslessly. Opened by your browser on this page, never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/bmp-to-png" },
  openGraph: {
    title: "BMP to PNG Converter — Lossless PNG, Same Name and Size",
    description: "Save a Windows .bmp bitmap as a PNG with the same width, height and name, stored losslessly. Opened by your browser on this page, never uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/bmp-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/bmp-to-png">{children}</ToolSeo>;
}
