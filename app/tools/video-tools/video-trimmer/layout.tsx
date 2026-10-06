import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Trimmer — Cut a Video Without Re-encoding" },
  description: "In default mode, the cut is made in your browser by stream copy, keeping format and quality; tick Precise cut to start on the exact frame, as an MP4.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-trimmer" },
  openGraph: {
    title: "Video Trimmer — Cut a Video Without Re-encoding",
    description: "In default mode, the cut is made in your browser by stream copy, keeping format and quality; tick Precise cut to start on the exact frame, as an MP4.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-trimmer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-trimmer">{children}</ToolSeo>;
}
