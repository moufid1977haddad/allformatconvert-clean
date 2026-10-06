import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Character Counter — Letters, Digits, Spaces, Byte Size" },
  description: "Count characters as they appear on screen, plus letters, digits, spaces, lines, UTF-16 code units and UTF-8 bytes, updated as you type.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/character-counter" },
  openGraph: {
    title: "Character Counter — Letters, Digits, Spaces, Byte Size",
    description: "Count characters as they appear on screen, plus letters, digits, spaces, lines, UTF-16 code units and UTF-8 bytes, updated as you type.",
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
