import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Splitter — Equal Parts, Every N Seconds or One Point" },
  description: "Split one audio file at a chosen point, into equal parts, or into a piece every N seconds. Download each part or all of them together as a ZIP.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-splitter" },
  openGraph: {
    title: "Audio Splitter — Equal Parts, Every N Seconds or One Point",
    description: "Split one audio file at a chosen point, into equal parts, or into a piece every N seconds. Download each part or all of them together as a ZIP.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-splitter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-splitter">{children}</ToolSeo>;
}
