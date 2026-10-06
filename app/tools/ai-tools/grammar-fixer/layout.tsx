import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Grammar Fixer — Fix Grammar and Spelling, See Every Change" },
  description: "Correct grammar, spelling and punctuation with minimal edits. Every change is shown in place and can be undone one by one before you copy.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/grammar-fixer" },
  openGraph: {
    title: "Grammar Fixer — Fix Grammar and Spelling, See Every Change",
    description: "Correct grammar, spelling and punctuation with minimal edits. Every change is shown in place and can be undone one by one before you copy.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/grammar-fixer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/grammar-fixer">{children}</ToolSeo>;
}
