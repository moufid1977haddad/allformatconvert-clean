import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Sentiment Analyzer — Positive, Negative or Neutral with AI" },
  description: "Find out if a review, comment or message reads as positive, negative or neutral, with a confidence estimate and the words behind the verdict.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/sentiment-analyzer" },
  openGraph: {
    title: "Sentiment Analyzer — Positive, Negative or Neutral with AI",
    description: "Find out if a review, comment or message reads as positive, negative or neutral, with a confidence estimate and the words behind the verdict.",
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
