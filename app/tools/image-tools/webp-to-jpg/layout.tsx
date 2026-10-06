import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "WebP to JPG Converter — Quality and Background Colour" },
  description: "Convert a WebP image to JPG, set the JPG quality and the colour that replaces transparent areas. The WebP is never sent to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/webp-to-jpg" },
  openGraph: {
    title: "WebP to JPG Converter — Quality and Background Colour",
    description: "Convert a WebP image to JPG, set the JPG quality and the colour that replaces transparent areas. The WebP is never sent to a server.",
    url: "https://www.onlineconvertools.com/tools/image-tools/webp-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/webp-to-jpg">{children}</ToolSeo>;
}
