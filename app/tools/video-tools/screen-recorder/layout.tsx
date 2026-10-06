import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Screen Recorder — Record Screen, Tab and Mic to MP4" },
  description: "Record a screen, window or tab, with tab or system sound on Chrome and Edge and your mic. Saves MP4 where the browser can; Firefox WebM converts to MP4.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/screen-recorder" },
  openGraph: {
    title: "Screen Recorder — Record Screen, Tab and Mic to MP4",
    description: "Record a screen, window or tab, with tab or system sound on Chrome and Edge and your mic. Saves MP4 where the browser can; Firefox WebM converts to MP4.",
    url: "https://www.onlineconvertools.com/tools/video-tools/screen-recorder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/screen-recorder">{children}</ToolSeo>;
}
