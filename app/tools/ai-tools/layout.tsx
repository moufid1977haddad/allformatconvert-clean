import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Tools — Ai-powered Image and Text Tools Online Free" },
  description: "AI Tools is a free online platform offering AI-powered utilities for productivity, content creation, and data analysis.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools" },
  openGraph: {
    title: "AI Tools — Ai-powered Image and Text Tools Online Free",
    description: "AI Tools is a free online platform offering AI-powered utilities for productivity, content creation, and data analysis.",
    url: "https://www.onlineconvertools.com/tools/ai-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
