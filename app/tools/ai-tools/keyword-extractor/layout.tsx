import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Keyword Extractor — AI Keyword List with Reasons" },
  description: "Paste an article and get a numbered list of its main keywords and key phrases, each with a short reason, from OpenAI's GPT-4o mini model.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/keyword-extractor" },
  openGraph: {
    title: "Keyword Extractor — AI Keyword List with Reasons",
    description: "Paste an article and get a numbered list of its main keywords and key phrases, each with a short reason, from OpenAI's GPT-4o mini model.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/keyword-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/keyword-extractor">{children}</ToolSeo>;
}
