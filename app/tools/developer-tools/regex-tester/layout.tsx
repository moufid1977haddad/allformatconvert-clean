import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Regex Tester — JavaScript RegExp Matches, Groups, Replace" },
  description: "Test a JavaScript regular expression on your text: matches highlighted with positions, numbered and named groups, and a replace preview with $1.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/regex-tester" },
  openGraph: {
    title: "Regex Tester — JavaScript RegExp Matches, Groups, Replace",
    description: "Test a JavaScript regular expression on your text: matches highlighted with positions, numbered and named groups, and a replace preview with $1.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/regex-tester",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/regex-tester">{children}</ToolSeo>;
}
