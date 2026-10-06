import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Round Corners of an Image — Transparent or Colored" },
  description: "Round the four corners of a photo with a radius slider. Corners turn transparent in a PNG, or take a color you pick so a JPG stays a JPG.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/round-corners" },
  openGraph: {
    title: "Round Corners of an Image — Transparent or Colored",
    description: "Round the four corners of a photo with a radius slider. Corners turn transparent in a PNG, or take a color you pick so a JPG stays a JPG.",
    url: "https://www.onlineconvertools.com/tools/image-tools/round-corners",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/round-corners">{children}</ToolSeo>;
}
