import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Translator — Translate AI Online Free" },
  description: "AI Translator is a free online translation tool powered by OpenAI's GPT-4o mini model.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-translator" },
  openGraph: {
    title: "AI Translator — Translate AI Online Free",
    description: "AI Translator is a free online translation tool powered by OpenAI's GPT-4o mini model.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-translator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
