import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Merger — Join Videos Into One MP4 Online Free" },
  description: "Video Merger joins two or more videos into one MP4 in the order you choose: alike clips are joined in your browser without re-encoding; different ones are first matched on our own video service, then deleted.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-merger" },
  openGraph: {
    title: "Video Merger — Join Videos Into One MP4 Online Free",
    description: "Video Merger joins two or more videos into one MP4 in the order you choose: alike clips are joined in your browser without re-encoding; different ones are first matched on our own video service, then deleted.",
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
