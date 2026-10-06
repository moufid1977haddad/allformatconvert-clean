import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Word Counter — Words, Characters, Reading Time, Keywords" },
  description: "Count words, characters, sentences and paragraphs live, see reading and speaking time, and list your most used words and phrases.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/word-counter" },
  openGraph: {
    title: "Word Counter — Words, Characters, Reading Time, Keywords",
    description: "Count words, characters, sentences and paragraphs live, see reading and speaking time, and list your most used words and phrases.",
    url: "https://www.onlineconvertools.com/tools/text-tools/word-counter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/word-counter">{children}</ToolSeo>;
}
