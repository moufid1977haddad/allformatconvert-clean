import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Grammar Fixer — Use Openai's Gpt-4o Mini Model Online Free" },
  description: "Grammar Fixer is a free online tool that uses OpenAI's GPT-4o mini model to correct spelling, punctuation, and grammatical errors in your writing.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/grammar-fixer" },
  openGraph: {
    title: "Grammar Fixer — Use Openai's Gpt-4o Mini Model Online Free",
    description: "Grammar Fixer is a free online tool that uses OpenAI's GPT-4o mini model to correct spelling, punctuation, and grammatical errors in your writing.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/grammar-fixer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
