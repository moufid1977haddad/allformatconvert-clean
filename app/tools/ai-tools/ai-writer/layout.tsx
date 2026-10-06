import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AI Writer — Draft Text from a Short Description" },
  description: "Describe what you need, from a blog intro to product copy, and get a first draft from GPT-4o mini, ready to copy or save as a .txt file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-writer" },
  openGraph: {
    title: "AI Writer — Draft Text from a Short Description",
    description: "Describe what you need, from a blog intro to product copy, and get a first draft from GPT-4o mini, ready to copy or save as a .txt file.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-writer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/ai-writer">{children}</ToolSeo>;
}
