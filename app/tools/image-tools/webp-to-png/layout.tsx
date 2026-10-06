import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "WebP to PNG Converter — For Apps That Do Not Open WebP" },
  description: "Save a WebP image as a lossless PNG that keeps its transparency, for programs that do not open WebP. Converted on this page by your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/webp-to-png" },
  openGraph: {
    title: "WebP to PNG Converter — For Apps That Do Not Open WebP",
    description: "Save a WebP image as a lossless PNG that keeps its transparency, for programs that do not open WebP. Converted on this page by your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/webp-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/webp-to-png">{children}</ToolSeo>;
}
