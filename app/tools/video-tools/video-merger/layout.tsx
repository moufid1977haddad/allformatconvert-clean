import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Merger — Join Clips Into One MP4 in Your Order" },
  description: "Join two or more videos into one MP4 in the order you set. Alike H.264 or HEVC clips are copied in your browser; others are matched on our video service.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-merger" },
  openGraph: {
    title: "Video Merger — Join Clips Into One MP4 in Your Order",
    description: "Join two or more videos into one MP4 in the order you set. Alike H.264 or HEVC clips are copied in your browser; others are matched on our video service.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-merger",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-merger">{children}</ToolSeo>;
}
