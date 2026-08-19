import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Paraphraser — Use Openai's Gpt-4o Mini Model Online Free" },
  description: "AI Paraphraser uses an AI language model to rewrite your text with different words and sentence structures while preserving its meaning.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-paraphraser" },
  openGraph: {
    title: "AI Paraphraser — Use Openai's Gpt-4o Mini Model Online Free",
    description: "AI Paraphraser uses an AI language model to rewrite your text with different words and sentence structures while preserving its meaning.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-paraphraser",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
