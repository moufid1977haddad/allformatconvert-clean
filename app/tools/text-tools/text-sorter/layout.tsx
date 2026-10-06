import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text Sorter — Sort Lines A-Z, by Length, Number or Random" },
  description: "Sort lines in dictionary order, by length or by leading number, or shuffle them. Item 2 comes before item 10, and capitals sort with lower case.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-sorter" },
  openGraph: {
    title: "Text Sorter — Sort Lines A-Z, by Length, Number or Random",
    description: "Sort lines in dictionary order, by length or by leading number, or shuffle them. Item 2 comes before item 10, and capitals sort with lower case.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-sorter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/text-sorter">{children}</ToolSeo>;
}
