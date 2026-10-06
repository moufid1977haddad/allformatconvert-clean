import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Compressor — Smaller MP4 in H.264, H.265 or AV1" },
  description: "Make a video lighter as an MP4: pick a compression level, a codec and a maximum resolution. Encoded by ffmpeg on our video service, up to 1 GB.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-compressor" },
  openGraph: {
    title: "Video Compressor — Smaller MP4 in H.264, H.265 or AV1",
    description: "Make a video lighter as an MP4: pick a compression level, a codec and a maximum resolution. Encoded by ffmpeg on our video service, up to 1 GB.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-compressor">{children}</ToolSeo>;
}
