import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text Summarizer — Summarize Text Online Free" },
  description: "Text Summarizer is a free online tool that uses OpenAI's GPT-4o mini model to condense long documents, articles, and passages into a concise summary while…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/text-summarizer" },
  openGraph: {
    title: "Text Summarizer — Summarize Text Online Free",
    description: "Text Summarizer is a free online tool that uses OpenAI's GPT-4o mini model to condense long documents, articles, and passages into a concise summary while…",
    url: "https://www.onlineconvertools.com/tools/ai-tools/text-summarizer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
