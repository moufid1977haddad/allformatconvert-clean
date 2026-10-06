import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AVI to GIF — Convert AVI Clips Your Browser Cannot Play" },
  description: "Turn a clip from an AVI video into an animated GIF. ffmpeg on our server reads the AVI, which browsers cannot play; set the start, length and width.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/avi-to-gif" },
  openGraph: {
    title: "AVI to GIF — Convert AVI Clips Your Browser Cannot Play",
    description: "Turn a clip from an AVI video into an animated GIF. ffmpeg on our server reads the AVI, which browsers cannot play; set the start, length and width.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/avi-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/avi-to-gif">{children}</ToolSeo>;
}
