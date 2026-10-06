import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video to GIF — Make a GIF or Extract PNG Frames From a Clip" },
  description: "Turn a clip of up to 60 seconds into an animated GIF on our video service, or save up to 150 PNG frames in your browser, one by one or as a ZIP.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-to-gif" },
  openGraph: {
    title: "Video to GIF — Make a GIF or Extract PNG Frames From a Clip",
    description: "Turn a clip of up to 60 seconds into an animated GIF on our video service, or save up to 150 PNG frames in your browser, one by one or as a ZIP.",
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
