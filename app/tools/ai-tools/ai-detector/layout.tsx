import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Detector — Detect AI Online Free" },
  description: "Free AI detector: was this text written by AI, a person, or both? Pangram's trained model, the fewest false accusations in an independent 2025 study. No signup.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-detector" },
  openGraph: {
    title: "AI Detector — Detect AI Online Free",
    description: "Free AI detector: was this text written by AI, a person, or both? Pangram's trained model, the fewest false accusations in an independent 2025 study. No signup.",
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
