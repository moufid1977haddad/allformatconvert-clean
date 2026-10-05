import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Character Counter — Instantly Breaks Down Any Text Online" },
  description: "Character Counter instantly breaks down any text into total characters, letters, numbers, spaces, and special characters, live.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/character-counter" },
  openGraph: {
    title: "Character Counter — Instantly Breaks Down Any Text Online",
    description: "Character Counter instantly breaks down any text into total characters, letters, numbers, spaces, and special characters, live.",
    url: "https://www.onlineconvertools.com/tools/text-tools/character-counter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/character-counter">{children}</ToolSeo>;
}
