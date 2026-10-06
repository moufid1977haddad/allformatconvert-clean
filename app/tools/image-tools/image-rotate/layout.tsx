import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Rotate Image — 90°, 180°, 270° or Any Custom Angle" },
  description: "Turn a photo clockwise by 90, 180 or 270 degrees, or by any angle to the half degree, with transparent or colored corners, on your own device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-rotate" },
  openGraph: {
    title: "Rotate Image — 90°, 180°, 270° or Any Custom Angle",
    description: "Turn a photo clockwise by 90, 180 or 270 degrees, or by any angle to the half degree, with transparent or colored corners, on your own device.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-rotate",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-rotate">{children}</ToolSeo>;
}
