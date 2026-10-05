import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text Summarizer — Summarize Text Online Free" },
  description: "Text Summarizer uses an AI language model to condense long documents and articles into a concise summary while preserving key points.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/text-summarizer" },
  openGraph: {
    title: "Text Summarizer — Summarize Text Online Free",
    description: "Text Summarizer uses an AI language model to condense long documents and articles into a concise summary while preserving key points.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/text-summarizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/text-summarizer">{children}</ToolSeo>;
}
