import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video to GIF — MP4, MOV, WebM, AVI or MKV to Animated GIF" },
  description: "Turn a clip of an MP4, MOV, WebM, AVI, MKV or WMV video into an animated GIF with six settings: start, length, width, frame rate, plays, compression.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/video-to-gif" },
  openGraph: {
    title: "Video to GIF — MP4, MOV, WebM, AVI or MKV to Animated GIF",
    description: "Turn a clip of an MP4, MOV, WebM, AVI, MKV or WMV video into an animated GIF with six settings: start, length, width, frame rate, plays, compression.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/video-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/video-to-gif">{children}</ToolSeo>;
}
