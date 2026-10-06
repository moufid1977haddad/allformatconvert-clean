import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text Reverser — Reverse Letters, Word Order or Line Order" },
  description: "Write a text backwards letter by letter, reverse the word order of each line, or flip the order of lines. Emoji and accents stay whole.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-reverser" },
  openGraph: {
    title: "Text Reverser — Reverse Letters, Word Order or Line Order",
    description: "Write a text backwards letter by letter, reverse the word order of each line, or flip the order of lines. Emoji and accents stay whole.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-reverser",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/text-reverser">{children}</ToolSeo>;
}
