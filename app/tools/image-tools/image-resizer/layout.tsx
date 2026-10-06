import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Resizer — Resize by Pixels or Percent, Ratio Locked" },
  description: "Resize a photo by width and height in pixels with the ratio locked, or shrink it by 25, 50 or 75%. Save as JPG, PNG or WebP with a quality setting.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-resizer" },
  openGraph: {
    title: "Image Resizer — Resize by Pixels or Percent, Ratio Locked",
    description: "Resize a photo by width and height in pixels with the ratio locked, or shrink it by 25, 50 or 75%. Save as JPG, PNG or WebP with a quality setting.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-resizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-resizer">{children}</ToolSeo>;
}
