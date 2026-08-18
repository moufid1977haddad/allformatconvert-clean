import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Word Counter — Instantly Analyzes Text Online Free" },
  description: "Word Counter instantly analyzes text for word count, character count (with and without spaces), sentence count, paragraph count, and estimated reading time…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/word-counter" },
  openGraph: {
    title: "Word Counter — Instantly Analyzes Text Online Free",
    description: "Word Counter instantly analyzes text for word count, character count (with and without spaces), sentence count, paragraph count, and estimated reading time…",
    url: "https://www.onlineconvertools.com/tools/text-tools/word-counter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
