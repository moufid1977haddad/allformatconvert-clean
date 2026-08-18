import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Sentiment Analyzer — Analyze Sentiments Online Free" },
  description: "Sentiment Analyzer is a free online tool that uses OpenAI's GPT-4o mini model to judge whether a piece of text is Positive, Negative, or Neutral, along…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/sentiment-analyzer" },
  openGraph: {
    title: "Sentiment Analyzer — Analyze Sentiments Online Free",
    description: "Sentiment Analyzer is a free online tool that uses OpenAI's GPT-4o mini model to judge whether a piece of text is Positive, Negative, or Neutral, along…",
    url: "https://www.onlineconvertools.com/tools/ai-tools/sentiment-analyzer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
