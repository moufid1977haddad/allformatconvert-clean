import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Filter — Grayscale, Sepia, Blur, Invert & More" },
  description: "Apply one effect to a whole video (grayscale, sepia, invert, blur, brightness, contrast or saturate), see it live, and get an MP4 from our video service.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-filter" },
  openGraph: {
    title: "Video Filter — Grayscale, Sepia, Blur, Invert & More",
    description: "Apply one effect to a whole video (grayscale, sepia, invert, blur, brightness, contrast or saturate), see it live, and get an MP4 from our video service.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-filter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-filter">{children}</ToolSeo>;
}
