import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AI Translator — Translate Text into 10 Languages" },
  description: "Translate pasted text into one of ten languages, from English and Spanish to Arabic, Chinese and Japanese. No need to pick the source language.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-translator" },
  openGraph: {
    title: "AI Translator — Translate Text into 10 Languages",
    description: "Translate pasted text into one of ten languages, from English and Spanish to Arabic, Chinese and Japanese. No need to pick the source language.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-translator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/ai-translator">{children}</ToolSeo>;
}
