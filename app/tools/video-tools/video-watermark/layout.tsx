import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Watermark — Add Text or a Logo to a Video" },
  description: "Burn a text or image watermark into a video of up to 2 minutes, with size, opacity, color and 9 positions. Encoded to MP4 in your browser, no upload.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-watermark" },
  openGraph: {
    title: "Video Watermark — Add Text or a Logo to a Video",
    description: "Burn a text or image watermark into a video of up to 2 minutes, with size, opacity, color and 9 positions. Encoded to MP4 in your browser, no upload.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-watermark",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-watermark">{children}</ToolSeo>;
}
