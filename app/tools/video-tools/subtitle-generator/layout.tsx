import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Subtitle Generator — Build SRT Subtitles Online Free" },
  description: "Subtitle Generator is a manual SRT subtitle builder — add rows with your own start time, end time, and text for each line.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/subtitle-generator" },
  openGraph: {
    title: "Subtitle Generator — Build SRT Subtitles Online Free",
    description: "Subtitle Generator is a manual SRT subtitle builder — add rows with your own start time, end time, and text for each line.",
    url: "https://www.onlineconvertools.com/tools/video-tools/subtitle-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/subtitle-generator">{children}</ToolSeo>;
}
