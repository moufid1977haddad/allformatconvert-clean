import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Sentiment Analyzer — Analyze Sentiments Online Free" },
  description: "Sentiment Analyzer uses an AI language model to judge whether text is Positive, Negative, or Neutral, with a confidence estimate.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/sentiment-analyzer" },
  openGraph: {
    title: "Sentiment Analyzer — Analyze Sentiments Online Free",
    description: "Sentiment Analyzer uses an AI language model to judge whether text is Positive, Negative, or Neutral, with a confidence estimate.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/sentiment-analyzer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/sentiment-analyzer">{children}</ToolSeo>;
}
