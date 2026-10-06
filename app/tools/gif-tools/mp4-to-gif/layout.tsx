import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "MP4 to GIF — Cut a Clip, Choose Width and Frame Rate" },
  description: "Make an animated GIF from part of an MP4: set the start, the length, the width and the frame rate. ffmpeg on our server builds the GIF, without sound.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/mp4-to-gif" },
  openGraph: {
    title: "MP4 to GIF — Cut a Clip, Choose Width and Frame Rate",
    description: "Make an animated GIF from part of an MP4: set the start, the length, the width and the frame rate. ffmpeg on our server builds the GIF, without sound.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/mp4-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/mp4-to-gif">{children}</ToolSeo>;
}
