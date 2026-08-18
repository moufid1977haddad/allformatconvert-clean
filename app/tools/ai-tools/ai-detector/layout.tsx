import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Detector — Detect AI Online Free" },
  description: "AI Detector is a free online tool that asks an AI language model (OpenAI's GPT-4o mini) to judge whether a piece of text was likely written by AI or a human…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-detector" },
  openGraph: {
    title: "AI Detector — Detect AI Online Free",
    description: "AI Detector is a free online tool that asks an AI language model (OpenAI's GPT-4o mini) to judge whether a piece of text was likely written by AI or a human…",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-detector",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
