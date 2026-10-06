import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "MOV to GIF — Turn iPhone and QuickTime Clips into GIFs" },
  description: "Convert a moment of an iPhone or QuickTime MOV video into an animated GIF on our server. Portrait clips keep their proportions; pick length and width.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/mov-to-gif" },
  openGraph: {
    title: "MOV to GIF — Turn iPhone and QuickTime Clips into GIFs",
    description: "Convert a moment of an iPhone or QuickTime MOV video into an animated GIF on our server. Portrait clips keep their proportions; pick length and width.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/mov-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/gif-tools/mov-to-gif">{children}</ToolSeo>;
}
