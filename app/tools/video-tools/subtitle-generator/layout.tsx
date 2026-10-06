import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Subtitle Generator — Type Lines, Get SRT and VTT Files" },
  description: "Type each subtitle with its start and end time and download valid SRT and WebVTT files, sorted by time, with every time checked before export.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/subtitle-generator" },
  openGraph: {
    title: "Subtitle Generator — Type Lines, Get SRT and VTT Files",
    description: "Type each subtitle with its start and end time and download valid SRT and WebVTT files, sorted by time, with every time checked before export.",
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
