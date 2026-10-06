import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AI Paraphraser — Reword Text, Keep the Meaning" },
  description: "Rewrite a sentence or a paragraph with new words and sentence structure while keeping its meaning. One version per click; copy it or save it.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-paraphraser" },
  openGraph: {
    title: "AI Paraphraser — Reword Text, Keep the Meaning",
    description: "Rewrite a sentence or a paragraph with new words and sentence structure while keeping its meaning. One version per click; copy it or save it.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-paraphraser",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/ai-paraphraser">{children}</ToolSeo>;
}
