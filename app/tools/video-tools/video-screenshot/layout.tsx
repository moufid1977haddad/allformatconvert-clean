import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Screenshot — Save a Frame as PNG, JPG or WebP" },
  description: "Grab any frame of a video as a PNG, JPG or WebP image at the video's own resolution. Jump to an exact second and capture as many stills as you need.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-screenshot" },
  openGraph: {
    title: "Video Screenshot — Save a Frame as PNG, JPG or WebP",
    description: "Grab any frame of a video as a PNG, JPG or WebP image at the video's own resolution. Jump to an exact second and capture as many stills as you need.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-screenshot",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-screenshot">{children}</ToolSeo>;
}
