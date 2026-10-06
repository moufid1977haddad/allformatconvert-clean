import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "WebM to GIF — VP8, VP9 and AV1 Clips to Animated GIF" },
  description: "Make an animated GIF from a WebM video with VP8, VP9 or AV1, such as a browser screen recording. ffmpeg on our server converts it; sound is dropped.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/webm-to-gif" },
  openGraph: {
    title: "WebM to GIF — VP8, VP9 and AV1 Clips to Animated GIF",
    description: "Make an animated GIF from a WebM video with VP8, VP9 or AV1, such as a browser screen recording. ffmpeg on our server converts it; sound is dropped.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/webm-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/webm-to-gif">{children}</ToolSeo>;
}
