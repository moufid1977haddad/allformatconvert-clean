import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video to GIF — Make an Animated GIF from a Video Online Free" },
  description: "Video to GIF makes an animated GIF from any clip (MP4, iPhone MOV, WebM…): choose start, length, width and frame rate. Frames as PNG too.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-to-gif" },
  openGraph: {
    title: "Video to GIF — Make an Animated GIF from a Video Online Free",
    description: "Video to GIF makes an animated GIF from any clip (MP4, iPhone MOV, WebM…): choose start, length, width and frame rate. Frames as PNG too.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-to-gif">{children}</ToolSeo>;
}
