import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "GIF Maker — Animated GIF from Images, Frame by Frame" },
  description: "Make an animated GIF from photos or GIF frames in your browser: reorder frames, set each duration, choose fit, crop or stretch, and the number of repeats.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-maker" },
  openGraph: {
    title: "GIF Maker — Animated GIF from Images, Frame by Frame",
    description: "Make an animated GIF from photos or GIF frames in your browser: reorder frames, set each duration, choose fit, crop or stretch, and the number of repeats.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-maker",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/gif-maker">{children}</ToolSeo>;
}
