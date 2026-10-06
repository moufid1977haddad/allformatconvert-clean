import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AI Detector — AI, Mixed or Human Verdict via Pangram" },
  description: "Check if a text was written by AI, a person or both. Pangram's classifier returns a verdict plus AI-written, AI-assisted and human shares.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-detector" },
  openGraph: {
    title: "AI Detector — AI, Mixed or Human Verdict via Pangram",
    description: "Check if a text was written by AI, a person or both. Pangram's classifier returns a verdict plus AI-written, AI-assisted and human shares.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-detector",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/ai-detector">{children}</ToolSeo>;
}
