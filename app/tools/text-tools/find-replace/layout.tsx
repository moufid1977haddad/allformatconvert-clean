import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Find and Replace Text — Plain Text or Regex, Whole Words" },
  description: "Replace every match in a text at once, as plain text or a JavaScript regular expression, with ignore-case and whole-word options.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/find-replace" },
  openGraph: {
    title: "Find and Replace Text — Plain Text or Regex, Whole Words",
    description: "Replace every match in a text at once, as plain text or a JavaScript regular expression, with ignore-case and whole-word options.",
    url: "https://www.onlineconvertools.com/tools/text-tools/find-replace",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/find-replace">{children}</ToolSeo>;
}
