import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image to GIF — Looping GIF Slideshow That Keeps Transparency" },
  description: "Turn a few pictures into a looping GIF slideshow in your browser. The first image sets the size, and transparent PNG areas stay transparent.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/image-to-gif" },
  openGraph: {
    title: "Image to GIF — Looping GIF Slideshow That Keeps Transparency",
    description: "Turn a few pictures into a looping GIF slideshow in your browser. The first image sets the size, and transparent PNG areas stay transparent.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/image-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/image-to-gif">{children}</ToolSeo>;
}
