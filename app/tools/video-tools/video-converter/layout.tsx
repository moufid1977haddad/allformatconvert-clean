import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Converter — Convert Video to MP4, MOV, GIF, MP3 & More Online Free" },
  description: "Video Converter turns almost any video into MP4, MOV, MKV, WebM, AVI, GIF and 22 video formats, or extracts the audio as MP3, WAV and more, on our own server. Any browser, files up to 1 GB, deleted after download.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-converter" },
  openGraph: {
    title: "Video Converter — Convert Video to MP4, MOV, GIF, MP3 & More Online Free",
    description: "Video Converter turns almost any video into MP4, MOV, MKV, WebM, AVI, GIF and 22 video formats, or extracts the audio as MP3, WAV and more, on our own server. Any browser, files up to 1 GB, deleted after download.",
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
