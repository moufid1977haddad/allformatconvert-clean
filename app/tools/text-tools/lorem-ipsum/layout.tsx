import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Lorem Ipsum Generator — Exact Words, Sentences, Paragraphs" },
  description: "Generate an exact number of Lorem ipsum words, sentences or paragraphs, opening with the start of the classic passage. Same request, same text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/lorem-ipsum" },
  openGraph: {
    title: "Lorem Ipsum Generator — Exact Words, Sentences, Paragraphs",
    description: "Generate an exact number of Lorem ipsum words, sentences or paragraphs, opening with the start of the classic passage. Same request, same text.",
    url: "https://www.onlineconvertools.com/tools/text-tools/lorem-ipsum",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/lorem-ipsum">{children}</ToolSeo>;
}
