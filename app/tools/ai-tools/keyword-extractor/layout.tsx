import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Keyword Extractor — Extract Keywords Online Free" },
  description: "Keyword Extractor uses an AI language model to identify the most important keywords and key phrases in a piece of text you provide.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/keyword-extractor" },
  openGraph: {
    title: "Keyword Extractor — Extract Keywords Online Free",
    description: "Keyword Extractor uses an AI language model to identify the most important keywords and key phrases in a piece of text you provide.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/keyword-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
