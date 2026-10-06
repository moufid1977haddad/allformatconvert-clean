import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Markdown Previewer — Check Pasted Markdown as Safe HTML" },
  description: "Paste Markdown to see the HTML it produces next to the source, with CommonMark and GitHub Flavored Markdown rules and unsafe HTML removed.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/markdown-previewer" },
  openGraph: {
    title: "Markdown Previewer — Check Pasted Markdown as Safe HTML",
    description: "Paste Markdown to see the HTML it produces next to the source, with CommonMark and GitHub Flavored Markdown rules and unsafe HTML removed.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/markdown-previewer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/markdown-previewer">{children}</ToolSeo>;
}
