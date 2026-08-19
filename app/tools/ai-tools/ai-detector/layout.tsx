import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Detector — Detect AI Online Free" },
  description: "AI Detector uses an AI language model to judge whether a piece of text was likely written by AI or by a human, based on writing patterns.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-detector" },
  openGraph: {
    title: "AI Detector — Detect AI Online Free",
    description: "AI Detector uses an AI language model to judge whether a piece of text was likely written by AI or by a human, based on writing patterns.",
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
