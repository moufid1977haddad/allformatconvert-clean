import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Trimmer — Keep Start to End, Add Fade In & Out" },
  description: "Keep the part of an audio file between a start and an end set to a tenth of a second, with optional fades. Without fades the sound is copied as is.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-trimmer" },
  openGraph: {
    title: "Audio Trimmer — Keep Start to End, Add Fade In & Out",
    description: "Keep the part of an audio file between a start and an end set to a tenth of a second, with optional fades. Without fades the sound is copied as is.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-trimmer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-trimmer">{children}</ToolSeo>;
}
