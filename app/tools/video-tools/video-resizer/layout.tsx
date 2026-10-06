import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Resizer — Resize or Crop a Video, MP4 Result" },
  description: "Change a video's width and height (fit with black bars, fill or stretch) or crop it to a box you draw. Done by ffmpeg on our video service, as an MP4.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-resizer" },
  openGraph: {
    title: "Video Resizer — Resize or Crop a Video, MP4 Result",
    description: "Change a video's width and height (fit with black bars, fill or stretch) or crop it to a box you draw. Done by ffmpeg on our video service, as an MP4.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-resizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-resizer">{children}</ToolSeo>;
}
