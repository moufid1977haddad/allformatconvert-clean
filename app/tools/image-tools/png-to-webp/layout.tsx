import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PNG to WebP — Keep Transparency, Lossy or Lossless" },
  description: "Convert a PNG to WebP and keep its transparent areas. Pick a quality from 1 to 100, or lossless mode for screenshots and logos. The PNG stays local.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/png-to-webp" },
  openGraph: {
    title: "PNG to WebP — Keep Transparency, Lossy or Lossless",
    description: "Convert a PNG to WebP and keep its transparent areas. Pick a quality from 1 to 100, or lossless mode for screenshots and logos. The PNG stays local.",
    url: "https://www.onlineconvertools.com/tools/image-tools/png-to-webp",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/png-to-webp">{children}</ToolSeo>;
}
