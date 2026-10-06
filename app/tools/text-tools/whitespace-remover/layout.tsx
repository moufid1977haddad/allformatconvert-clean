import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Whitespace Remover — Extra Spaces, Tabs and Blank Lines" },
  description: "Collapse repeated spaces and tabs, trim each line and shorten runs of blank lines without merging your lines, or join everything into one line.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/whitespace-remover" },
  openGraph: {
    title: "Whitespace Remover — Extra Spaces, Tabs and Blank Lines",
    description: "Collapse repeated spaces and tabs, trim each line and shorten runs of blank lines without merging your lines, or join everything into one line.",
    url: "https://www.onlineconvertools.com/tools/text-tools/whitespace-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/whitespace-remover">{children}</ToolSeo>;
}
