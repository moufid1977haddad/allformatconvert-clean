import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text to List — Bullet, Numbered or Comma-Separated List" },
  description: "Turn lines of text into a bullet list with •, a numbered list, or one comma-separated line. Blank lines are skipped. Copy it or save a .txt file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-to-list" },
  openGraph: {
    title: "Text to List — Bullet, Numbered or Comma-Separated List",
    description: "Turn lines of text into a bullet list with •, a numbered list, or one comma-separated line. Blank lines are skipped. Copy it or save a .txt file.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-to-list",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/text-to-list">{children}</ToolSeo>;
}
