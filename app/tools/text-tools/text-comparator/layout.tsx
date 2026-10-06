import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text Comparator — Side-by-Side Diff With Changed Words" },
  description: "Paste two texts and see them side by side: matching lines aligned, changed words in red and green, added lines alone. Case and spacing can be ignored.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-comparator" },
  openGraph: {
    title: "Text Comparator — Side-by-Side Diff With Changed Words",
    description: "Paste two texts and see them side by side: matching lines aligned, changed words in red and green, added lines alone. Case and spacing can be ignored.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-comparator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/text-comparator">{children}</ToolSeo>;
}
