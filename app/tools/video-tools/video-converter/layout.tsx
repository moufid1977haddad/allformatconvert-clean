import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Converter — MP4, MOV, MKV, WebM, AVI, GIF, MP3 & More" },
  description: "Convert a video to 22 video formats, an animated GIF or 11 audio formats, with speed, mirror, volume and fade options. Done on our video service.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-converter" },
  openGraph: {
    title: "Video Converter — MP4, MOV, MKV, WebM, AVI, GIF, MP3 & More",
    description: "Convert a video to 22 video formats, an animated GIF or 11 audio formats, with speed, mirror, volume and fade options. Done on our video service.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-converter">{children}</ToolSeo>;
}
